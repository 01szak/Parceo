package pl.parceo.service.notification;

import co.novu.models.components.TriggerEventRequestDto;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public enum NovuWorkflow {

    VERIFY_RESERVATION_WORKFLOW("reservation-verification-email");

    @Getter private final String workflow;

    public TriggerEventRequestDto.Builder getWorkflowBuilder() {
        return TriggerEventRequestDto.builder().workflowId(workflow);
    }

}
