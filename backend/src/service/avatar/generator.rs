use anyhow::{Context, Result};
use aws_sdk_s3::primitives::ByteStream;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use tokio::time::{sleep, Duration};
use uuid::Uuid;

const LEONARDO_BASE: &str = "https://cloud.leonardo.ai/api/rest";
const POLL_INTERVAL: Duration = Duration::from_secs(5);
const MAX_POLLS: u32 = 72; // 6 minutes max

// ---------------------------------------------------------------------------
// Init image upload
// ---------------------------------------------------------------------------

#[derive(Deserialize)]
struct InitImageResp {
    #[serde(rename = "uploadInitImage")]
    data: InitImageData,
}

#[derive(Deserialize)]
struct InitImageData {
    id: String,
    url: String,
    fields: serde_json::Value,
}

pub async fn upload_init_image(
    client: &Client,
    api_key: &str,
    image_bytes: Vec<u8>,
    extension: &str,
) -> Result<String> {
    let resp: InitImageResp = client
        .post(format!("{}/v1/init-image", LEONARDO_BASE))
        .bearer_auth(api_key)
        .json(&serde_json::json!({ "extension": extension }))
        .send()
        .await?
        .error_for_status()?
        .json()
        .await
        .context("Failed to parse init-image response")?;

    let data = resp.data;
    let id = data.id.clone();

    // Upload bytes to the presigned S3 URL returned by Leonardo
    let fields_map: serde_json::Map<String, serde_json::Value> = match &data.fields {
        serde_json::Value::Object(m) => m.clone(),
        serde_json::Value::String(s) => serde_json::from_str(s)
            .context("Failed to parse init-image fields JSON string")?,
        other => anyhow::bail!("init-image fields has unexpected type: {}", other),
    };

    let mut form = reqwest::multipart::Form::new();
    for (k, v) in &fields_map {
        if let Some(s) = v.as_str() {
            form = form.text(k.clone(), s.to_string());
        }
    }
    form = form.part(
        "file",
        reqwest::multipart::Part::bytes(image_bytes)
            .file_name(format!("image.{}", extension))
            .mime_str(&format!("image/{}", extension))?,
    );

    client
        .post(&data.url)
        .multipart(form)
        .send()
        .await?
        .error_for_status()?;

    Ok(id)
}

// ---------------------------------------------------------------------------
// Prompt construction
// ---------------------------------------------------------------------------

fn build_activities_section(activity_data: &str) -> String {
    if activity_data.is_empty() {
        return String::new();
    }

    let mut entries: Vec<(String, f64)> = activity_data
        .split(',')
        .filter_map(|part| {
            let mut iter = part.trim().rsplitn(2, ':');
            let hours: f64 = iter.next()?.trim().parse().ok()?;
            let label = iter.next()?.trim().to_string();
            Some((label, hours))
        })
        .collect();

    entries.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));
    entries.truncate(4);

    let total: f64 = entries.iter().map(|(_, h)| h).sum();
    if total == 0.0 {
        return String::new();
    }

    entries
        .iter()
        .filter_map(|(label, hours)| {
            let pct = hours / total;
            let tier = if pct >= 0.20 {
                "dominant"
            } else if pct >= 0.05 {
                "secondary"
            } else {
                return None;
            };
            Some(format!("- {}: {}h ({})", label, hours.round() as u64, tier))
        })
        .collect::<Vec<_>>()
        .join("\n")
}

fn build_prompt(activity_data: &str) -> String {
    let activities = build_activities_section(activity_data);
    format!(
        r#"Use the attached image as a STRICT reference.

LOCKED CHARACTER (DO NOT CHANGE UNDER ANY CIRCUMSTANCE):
- Exact same character identity (face, hair, beard, eyes, proportions)
- Exact same pose and full body orientation (DO NOT rotate, mirror, or change viewpoint; never show from behind)
- Character is a fixed reference model placed into scenes (like a statue)
- Same low-poly 3D isometric diorama style and camera angle

ALL CHARACTER CHANGES ARE FORBIDDEN:
- No redesign of face, body, or proportions
- No pose changes
- No camera angle changes

SCENE RULE (ONLY PLACE CHANGES HERE):
- Only the environment may change to express activity
- Full redesign of room architecture, walls, floors, furniture, lighting, and props
- Clothing and small accessories may adapt, but must NOT affect identity or pose

LIGHTING:
Activity-driven lighting (mood, color temperature, light sources)

CLOTHING:
Must reflect activity theme but keep the same character body and silhouette

ACTIVITY PRIORITY:
- 60–80% dominant activity defines environment + lighting + clothing theme
- Medium activity creates secondary zones
- Low activity = minor props only

STYLE:
Low-poly 3D isometric diorama, toy-like miniature world, cinematic, vibrant environmental storytelling

ACTIVITIES:
{activities}"#
    )
}

// ---------------------------------------------------------------------------
// Generation request / polling
// ---------------------------------------------------------------------------

#[derive(Serialize)]
struct GenerationRequest {
    model: String,
    parameters: GenerationParameters,
    public: bool,
}

#[derive(Serialize)]
struct GenerationParameters {
    width: u32,
    height: u32,
    prompt: String,
    quantity: u32,
    style_ids: Vec<&'static str>,
    prompt_enhance: &'static str,
    guidances: Guidances,
}

#[derive(Serialize)]
struct Guidances {
    image_reference: Vec<ImageReference>,
}

#[derive(Serialize)]
struct ImageReference {
    image: ImageRefId,
    strength: &'static str,
}

#[derive(Serialize)]
struct ImageRefId {
    id: String,
    #[serde(rename = "type")]
    image_type: &'static str,
}

#[derive(Deserialize)]
struct GenerationJobResp {
    generate: GenerationJob,
}

#[derive(Deserialize)]
struct GenerationJob {
    #[serde(rename = "generationId")]
    id: String,
}

#[derive(Deserialize)]
struct GenerationStatusResp {
    generations_by_pk: GenerationByPk,
}

#[derive(Deserialize)]
struct GenerationByPk {
    status: String,
    generated_images: Vec<GeneratedImage>,
}

#[derive(Deserialize)]
struct GeneratedImage {
    url: String,
}

async fn poll_until_complete(client: &Client, api_key: &str, generation_id: &str) -> Result<String> {
    for _ in 0..MAX_POLLS {
        sleep(POLL_INTERVAL).await;

        let poll_body = client
            .get(format!("{}/v1/generations/{}", LEONARDO_BASE, generation_id))
            .bearer_auth(api_key)
            .send()
            .await?
            .error_for_status()?
            .text()
            .await
            .context("Failed to read generation status body")?;

        let resp: GenerationStatusResp = serde_json::from_str(&poll_body)
            .with_context(|| format!("Failed to parse generation status: {}", poll_body))?;

        let gen = resp.generations_by_pk;
        match gen.status.as_str() {
            "COMPLETE" => {
                return gen
                    .generated_images
                    .into_iter()
                    .next()
                    .map(|img| img.url)
                    .context("Generation COMPLETE but no images returned");
            }
            "FAILED" => anyhow::bail!("Leonardo generation FAILED"),
            _ => {}
        }
    }

    anyhow::bail!("Leonardo generation timed out after {} polls", MAX_POLLS)
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/// Generates an avatar given an already-uploaded preset init image ID.
/// Use this when the preset's `leonardo_init_image_id` is already cached.
pub async fn generate_avatar_with_init_id(
    client: &Client,
    api_key: &str,
    model_id: &str,
    layout_reference_id: &str,
    preset_init_id: &str,
    activity_data: &str,
) -> Result<Vec<u8>> {
    let prompt = build_prompt(activity_data);

    let gen_req = GenerationRequest {
        model: model_id.to_string(),
        parameters: GenerationParameters {
            width: 2048,
            height: 2048,
            prompt,
            quantity: 1,
            style_ids: vec!["556c1ee5-ec38-42e8-955a-1e82dad0ffa1"],
            prompt_enhance: "OFF",
            guidances: Guidances {
                image_reference: vec![
                    ImageReference {
                        image: ImageRefId { id: preset_init_id.to_string(), image_type: "UPLOADED" },
                        strength: "HIGH",
                    },
                    ImageReference {
                        image: ImageRefId { id: layout_reference_id.to_string(), image_type: "UPLOADED" },
                        strength: "HIGH",
                    },
                ],
            },
        },
        public: false,
    };

    let gen_response = client
        .post(format!("{}/v2/generations", LEONARDO_BASE))
        .bearer_auth(api_key)
        .json(&gen_req)
        .send()
        .await?
        .error_for_status()
        .context("Failed to submit generation request")?;

    let gen_body = gen_response.text().await.context("Failed to read generation response body")?;
    tracing::debug!(body = %gen_body, "Leonardo /v2/generations raw response");

    let job: GenerationJobResp = serde_json::from_str(&gen_body)
        .with_context(|| format!("Failed to parse generation job response: {}", gen_body))?;

    let image_url = poll_until_complete(client, api_key, &job.generate.id).await?;

    // 6. Download the generated image
    let image_bytes = client
        .get(&image_url)
        .send()
        .await?
        .error_for_status()
        .context("Failed to download generated image")?
        .bytes()
        .await?
        .to_vec();

    Ok(image_bytes)
}

// ---------------------------------------------------------------------------
// Image processing and S3 upload (unchanged)
// ---------------------------------------------------------------------------

/// Uploads a preset image (full + 100×100 thumb) to S3 under the `presets/` prefix.
/// Returns `(full_image_url, thumb_url)`.
pub async fn upload_preset_image_to_s3(
    client: &aws_sdk_s3::Client,
    bucket: &str,
    endpoint_url: &str,
    image_bytes: Vec<u8>,
    extension: &str,
) -> Result<(String, String)> {
    let id = Uuid::new_v4();
    let image_key = format!("presets/{}.{}", id, extension);
    let thumb_key = format!("presets/{}_thumb.jpg", id);

    let thumb_bytes = crop_center_100x100(&image_bytes)?;

    let content_type = if extension == "jpg" { "image/jpeg".to_string() } else { format!("image/{}", extension) };

    client
        .put_object()
        .bucket(bucket)
        .key(&image_key)
        .body(ByteStream::from(image_bytes))
        .content_type(content_type)
        .send()
        .await?;

    client
        .put_object()
        .bucket(bucket)
        .key(&thumb_key)
        .body(ByteStream::from(thumb_bytes))
        .content_type("image/jpeg")
        .send()
        .await?;

    let base = endpoint_url.trim_end_matches('/');
    let image_url = format!("{}/{}/{}", base, bucket, image_key);
    let thumb_url = format!("{}/{}/{}", base, bucket, thumb_key);

    Ok((image_url, thumb_url))
}

/// Cuts a region from the image centered at (w/2, ~870px from top in a 2048×2048 reference).
/// Coordinates and crop size scale proportionally with the actual image dimensions.
pub fn crop_center_100x100(image_bytes: &[u8]) -> Result<Vec<u8>> {
    use image::GenericImageView;
    let img = image::load_from_memory(image_bytes)?;
    let (w, h) = img.dimensions();

    const REF_SIZE: u32 = 2048;
    const REF_CENTER_Y: u32 = 870;
    const CROP_W: u32 = 690;
    const CROP_H: u32 = 690;

    let cx = w / 2;
    let cy = REF_CENTER_Y * h / REF_SIZE;

    let left = cx.saturating_sub(CROP_W / 2).min(w.saturating_sub(CROP_W));
    let top = cy.saturating_sub(CROP_H / 2).min(h.saturating_sub(CROP_H));

    let cropped = img.crop_imm(left, top, CROP_W, CROP_H);

    let mut cursor = std::io::Cursor::new(Vec::new());
    cropped.write_to(&mut cursor, image::ImageFormat::Jpeg)?;
    Ok(cursor.into_inner())
}

/// Uploads the full image and a 100×100 thumbnail to S3.
/// Returns `(full_image_url, thumb_url)`.
pub async fn upload_avatar_images(
    client: &aws_sdk_s3::Client,
    bucket: &str,
    endpoint_url: &str,
    user_id: &str,
    image_bytes: Vec<u8>,
) -> Result<(String, String)> {
    let id = Uuid::new_v4();
    let image_key = format!("avatars/{}/{}.jpg", user_id, id);
    let thumb_key = format!("avatars/{}/{}_thumb.jpg", user_id, id);

    let thumb_bytes = crop_center_100x100(&image_bytes)?;

    client
        .put_object()
        .bucket(bucket)
        .key(&image_key)
        .body(ByteStream::from(image_bytes))
        .content_type("image/jpeg")
        .send()
        .await?;

    client
        .put_object()
        .bucket(bucket)
        .key(&thumb_key)
        .body(ByteStream::from(thumb_bytes))
        .content_type("image/jpeg")
        .send()
        .await?;

    let base = endpoint_url.trim_end_matches('/');
    let image_url = format!("{}/{}/{}", base, bucket, image_key);
    let thumb_url = format!("{}/{}/{}", base, bucket, thumb_key);

    Ok((image_url, thumb_url))
}
