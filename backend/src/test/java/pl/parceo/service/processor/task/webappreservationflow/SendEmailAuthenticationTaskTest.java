package pl.parceo.service.processor.task.webappreservationflow;

import pl.parceo.model.EmailData;
import pl.parceo.model.constant.SupportedLocale;
import pl.parceo.model.constant.TaskType;
import pl.parceo.model.dto.GuestDTO;
import pl.parceo.model.entity.Task;
import pl.parceo.service.notification.NovuWorkflow;
import co.novu.Novu;
import co.novu.models.components.TriggerEventRequestDto;
import co.novu.models.operations.EventsControllerTriggerRequestBuilder;
import co.novu.models.operations.EventsControllerTriggerResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SendEmailAuthenticationTaskTest {

    private static final String TARGET_ID = "target-abc";

    @Mock
    private Novu novu;
    @Mock
    private EventsControllerTriggerRequestBuilder triggerBuilder;

    private SendEmailAuthenticationTask task;

    @BeforeEach
    void setUp() {
        final var guest = new GuestDTO(7, "Ada", "Kowalska", "ada@example.com", "600700800", null, "PL");
        final var taskEntity = Task.builder()
                .targetId(TARGET_ID)
                .payload(new EmailData(SupportedLocale.en, guest, new Object()))
                .taskType(TaskType.SEND_EMAIL_AUTHENTICATION_TASK)
                .build();
        task = new SendEmailAuthenticationTask(novu, taskEntity);

        when(novu.trigger()).thenReturn(triggerBuilder);
        when(triggerBuilder.body(any(TriggerEventRequestDto.class))).thenReturn(triggerBuilder);
        when(triggerBuilder.call()).thenReturn(mock(EventsControllerTriggerResponse.class));
    }

    @Test
    void triggersTheAuthenticationWorkflowCarryingTheTargetId() {
        task.doTask();

        final var bodyCaptor = ArgumentCaptor.forClass(TriggerEventRequestDto.class);
        verify(triggerBuilder).body(bodyCaptor.capture());
        verify(triggerBuilder).call();

        final var body = bodyCaptor.getValue();
        assertThat(body.workflowId()).isEqualTo(NovuWorkflow.VERIFY_RESERVATION_WORKFLOW.getWorkflow());
        assertThat(body.payload()).hasValueSatisfying(payload ->
                assertThat(payload).containsEntry("targetId", TARGET_ID).containsEntry("locale", SupportedLocale.en));
        assertThat(body.to()).isNotNull();
    }
}
