package pl.parceo.service.processor.task.webappreservationflow;

import pl.parceo.model.EmailData;
import pl.parceo.model.dto.GuestDTO;
import pl.parceo.model.entity.Task;
import pl.parceo.service.notification.NovuWorkflow;
import pl.parceo.service.processor.task.ExecutableTask;
import co.novu.Novu;
import co.novu.models.components.SubscriberPayloadDto;
import co.novu.models.components.TriggerEventRequestDtoTo2;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.Map;


@Slf4j
@RequiredArgsConstructor
public class SendEmailAuthenticationTask implements ExecutableTask {

    private final Novu novu;
    private final Task sendEmailAuthenticationTaskEntity;

    @Override
    public void doTask() {
        final var emailData = objectMapper.convertValue(sendEmailAuthenticationTaskEntity.getPayload(), EmailData.class);
        final var guest = emailData.guest();
        final var additionalPayload = emailData.additionalPayload();
        final var subscriber = buildSubscriber(guest);
        final var to = TriggerEventRequestDtoTo2.of(subscriber);
        final var payload = Map.of(
                "targetId", sendEmailAuthenticationTaskEntity.getTargetId(),
                "locale", emailData.locale(),
                "additionalPayload", additionalPayload
        );
        final var workflow = NovuWorkflow.VERIFY_RESERVATION_WORKFLOW.getWorkflowBuilder().to(to).payload(payload).build();
        log.info("Triggering Novu workflow with workflowId: {}", workflow.workflowId());
        try {
            final var response = novu.trigger().body(workflow).call();

            if (response.statusCode() < 300) {
                log.info("Workflow triggered successfully, Novu responded with status: {}", response.statusCode());
            } else {
                final var failureReason = response.triggerEventResponseDto().isPresent()
                        ? response.triggerEventResponseDto().get()
                        : "Unknown";
                log.warn("Failed to trigger workflow, Novu responded with status: {} reason: {}",
                        response.statusCode(),
                        failureReason
                );
            }
        } catch (Exception e) {
            log.error("Something went wrong while trying to trigger the Novu workflow with workflowId: {}", workflow.workflowId(), e);
        }

    }

    private SubscriberPayloadDto buildSubscriber(GuestDTO guest) {
        return SubscriberPayloadDto.builder()
                .subscriberId(String.valueOf(guest.id()))
                .firstName(guest.firstname())
                .lastName(guest.lastname())
                .email(guest.email())
                .phone(guest.phoneNumber())
                .build();
    }

}
