use anyhow::Result;
use std::sync::Arc;
use uuid::Uuid;

use crate::{
    config::database::Database,
    dto::{
        notification::{
            CreateNotificationDto, MarkNotificationsSeenDto, NotificationCountDto,
            NotificationQueryDto, ReadNotificationDto,
        },
        user::read_user::ReadUserDto,
    },
    entity::notification::{
        FriendRequestAcceptedData, FriendRequestData, NotificationSource, NotificationType,
        SessionReactionData, SystemNotificationData,
    },
    repository::notification::NotificationRepository,
    router::clerk::ClerkUser,
    service::friend_service::ReadFriendRequestDto,
};

#[derive(Clone)]
pub struct NotificationService {
    repository: NotificationRepository,
}

impl NotificationService {
    pub fn new(db: &Arc<Database>) -> Self {
        Self {
            repository: NotificationRepository::new(db),
        }
    }

    pub async fn get_notifications(
        &self,
        user_id: String,
        query: NotificationQueryDto,
    ) -> Result<Vec<ReadNotificationDto>> {
        let notifications = self.repository.get_notifications(user_id, query).await?;

        Ok(notifications
            .into_iter()
            .map(ReadNotificationDto::from)
            .collect())
    }

    pub async fn get_unseen_notifications(
        &self,
        user_id: String,
        limit: Option<i64>,
    ) -> Result<Vec<ReadNotificationDto>> {
        let query = NotificationQueryDto {
            seen: Some(false),
            limit,
            cursor: None,
        };

        self.get_notifications(user_id, query).await
    }

    pub async fn mark_notifications_seen(
        &self,
        dto: MarkNotificationsSeenDto,
        actor: ClerkUser,
    ) -> Result<u64> {
        self.repository
            .mark_notifications_seen(&dto.notification_ids, actor)
            .await
    }

    /// Get notification counts for a user
    pub async fn get_notification_counts(&self, user_id: String) -> Result<NotificationCountDto> {
        let unseen_count = self.repository.get_unseen_count(user_id.clone()).await?;
        let total_count = self.repository.get_total_count(user_id).await?;

        Ok(NotificationCountDto {
            unseen_count,
            total_count,
        })
    }

    pub async fn create_notification(&self, dto: CreateNotificationDto) -> Result<Uuid> {
        self.repository.create_notification(dto).await
    }

    pub async fn delete_notification(
        &self,
        notification_id: Uuid,
        actor: ClerkUser,
    ) -> Result<bool> {
        self.repository
            .delete_notification(notification_id, actor)
            .await
    }

    pub async fn notify_friend_request(&self, request: ReadFriendRequestDto) -> Result<Uuid> {
        let dto = CreateNotificationDto {
            user_id: request.recipient.id.clone(),
            source: NotificationSource::User(request.requestor.clone()),
            notification_type: NotificationType::FriendNewRequest(FriendRequestData {
                request_id: request.id,
                requestor: request.requestor.clone(),
                message: request.introduction_message,
            }),
        };

        self.create_notification(dto).await
    }

    pub async fn notify_friend_request_accepted(
        &self,
        request: ReadFriendRequestDto,
    ) -> Result<Uuid> {
        let dto = CreateNotificationDto {
            user_id: request.requestor.id,
            source: NotificationSource::User(request.recipient.clone()),
            notification_type: NotificationType::FriendRequestAccepted(FriendRequestAcceptedData {
                accepter: request.recipient.clone(),
            }),
        };

        self.create_notification(dto).await
    }

    pub async fn notify_session_reaction(
        &self,
        session_owner_user_id: String,
        reactor_user_dto: crate::dto::user::read_user::ReadUserDto,
        reaction_dto: crate::dto::feed::ReadFeedReactionDto,
        session_id: Uuid,
        session_category: crate::entity::category::Category,
        session_start_time: chrono::DateTime<chrono::Local>,
        session_end_time: chrono::DateTime<chrono::Local>,
    ) -> Result<Uuid> {
        // Dont notify users about their own reactions
        if session_owner_user_id == reactor_user_dto.id {
            return Ok(Uuid::new_v4()); // Return dummy ID
        }

        let dto = CreateNotificationDto {
            user_id: session_owner_user_id,
            source: NotificationSource::User(reactor_user_dto),
            notification_type: NotificationType::SessionReactionAdded(SessionReactionData {
                reaction: reaction_dto,
                session_id,
                session_category,
                session_start_time,
                session_end_time,
            }),
        };

        self.create_notification(dto).await
    }

    pub async fn notify_system_announcement(
        &self,
        user_ids: Vec<String>,
        release_id: Uuid,
        title: String,
        short_description: Option<String>,
    ) -> Result<Vec<Uuid>> {
        let mut notification_ids = Vec::new();

        for user_id in user_ids {
            let dto = CreateNotificationDto {
                user_id,
                source: NotificationSource::System(SystemNotificationData {
                    system_id: "nowaster-system".to_string(),
                    system_name: "Nowaster".to_string(),
                }),
                notification_type: NotificationType::SystemNewRelease(
                    crate::entity::notification::SystemReleaseData {
                        release_id,
                        title: title.clone(),
                        short_description: short_description.clone(),
                    },
                ),
            };

            let notification_id = self.create_notification(dto).await?;
            notification_ids.push(notification_id);
        }

        Ok(notification_ids)
    }

    pub async fn cleanup_old_notifications(&self, user_id: String, days_old: i64) -> Result<u64> {
        let cutoff_date = chrono::Local::now() - chrono::Duration::days(days_old);
        self.repository
            .cleanup_old_notifications(user_id, cutoff_date)
            .await
    }
}
