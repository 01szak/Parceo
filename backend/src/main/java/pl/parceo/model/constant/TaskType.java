package pl.parceo.model.constant;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum TaskType {
    SEND_EMAIL_AUTHENTICATION_TASK(true),
    TEMPORARY_PAYLOAD_HOLDER_TASK(false),
    RESERVATION_STATUS_VERIFIER_TASK(false),
    WEB_APP_RESERVATION_TASK(false);

    private final boolean retryable;
}
