use anyhow::Result;
use aws_sdk_s3::primitives::ByteStream;
use uuid::Uuid;

/// Placeholder for the Leonardo.ai image generation API.
/// Inputs match the final interface so the swap-in is a one-liner.
pub async fn generate_avatar(
    _template_image_url: &str,
    _base_character_url: &str,
    _activity_data: &str,
) -> Result<Vec<u8>> {
    placeholder_image()
}

/// Returns a 512×512 solid-colour JPEG as a stand-in for a real generation.
fn placeholder_image() -> Result<Vec<u8>> {
    use image::{ImageBuffer, Rgb};
    let img: ImageBuffer<Rgb<u8>, Vec<u8>> =
        ImageBuffer::from_fn(512, 512, |_, _| Rgb([100u8, 149u8, 237u8]));
    let mut cursor = std::io::Cursor::new(Vec::new());
    img.write_to(&mut cursor, image::ImageFormat::Jpeg)?;
    Ok(cursor.into_inner())
}

/// Center-crops `image_bytes` and resizes to 100×100 JPEG.
pub fn crop_center_100x100(image_bytes: &[u8]) -> Result<Vec<u8>> {
    use image::GenericImageView;
    let img = image::load_from_memory(image_bytes)?;
    let (w, h) = img.dimensions();
    let size = w.min(h);
    let cropped = img.crop_imm((w - size) / 2, (h - size) / 2, size, size);
    let thumb = cropped.resize_exact(100, 100, image::imageops::FilterType::Lanczos3);
    let mut cursor = std::io::Cursor::new(Vec::new());
    thumb.write_to(&mut cursor, image::ImageFormat::Jpeg)?;
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
