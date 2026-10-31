package pl.parceo.service.processor;

import pl.parceo.BaseIT;
import pl.parceo.model.constant.TaskStatus;
import pl.parceo.model.constant.TaskType;
import pl.parceo.model.entity.Task;
import pl.parceo.repository.TaskRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class TaskCleanupTaskIT extends BaseIT {

    @Autowired
    private TaskRepository taskRepository;

    private Task persistTask(TaskType type, TaskStatus status, long retryCount, Duration age, Task parent) {
        final var task = Task.builder()
                .targetId(UUID.randomUUID().toString())
                .taskType(type)
                .taskStatus(status)
                .retryCount(retryCount)
                .parentTask(parent)
                .build();
        task.setCreatedAt(Date.from(Instant.now().minus(age)));
        return taskRepository.save(task);
    }

    @Test
    void removesPayloadHolderTasksOlderThanTtlAndKeepsFreshOnes() {
        final var stale = persistTask(TaskType.TEMPORARY_PAYLOAD_HOLDER_TASK, TaskStatus.ON_HOLD, 0, Duration.ofMinutes(20), null);
        final var fresh = persistTask(TaskType.TEMPORARY_PAYLOAD_HOLDER_TASK, TaskStatus.ON_HOLD, 0, Duration.ofMinutes(5), null);

        final var removed = taskService.cleanupStalePayloadHolderTasks();

        assertThat(removed).isEqualTo(1);
        assertThat(taskRepository.existsById(stale.getId())).isFalse();
        assertThat(taskRepository.existsById(fresh.getId())).isTrue();
    }

    @Test
    void removesTerminalFailedTasksOlderThanTtlOnly() {
        // not retryable + old -> removed
        final var notRetryable = persistTask(TaskType.WEB_APP_RESERVATION_TASK, TaskStatus.FAILED, 0, Duration.ofDays(40), null);
        // retryable, limit reached + old -> removed
        final var limitReached = persistTask(TaskType.SEND_EMAIL_AUTHENTICATION_TASK, TaskStatus.FAILED, 5, Duration.ofDays(40), null);
        // retryable, still under the limit + old -> kept
        final var underLimit = persistTask(TaskType.SEND_EMAIL_AUTHENTICATION_TASK, TaskStatus.FAILED, 2, Duration.ofDays(40), null);
        // terminal but not old enough -> kept
        final var recent = persistTask(TaskType.WEB_APP_RESERVATION_TASK, TaskStatus.FAILED, 0, Duration.ofDays(10), null);

        final var removed = taskService.cleanupExhaustedFailedTasks();

        assertThat(removed).isEqualTo(2);
        assertThat(taskRepository.existsById(notRetryable.getId())).isFalse();
        assertThat(taskRepository.existsById(limitReached.getId())).isFalse();
        assertThat(taskRepository.existsById(underLimit.getId())).isTrue();
        assertThat(taskRepository.existsById(recent.getId())).isTrue();
    }

    @Test
    void doesNotDeleteATaskThatIsStillReferencedAsParent() {
        final var parent = persistTask(TaskType.WEB_APP_RESERVATION_TASK, TaskStatus.FAILED, 0, Duration.ofDays(40), null);
        persistTask(TaskType.SEND_EMAIL_AUTHENTICATION_TASK, TaskStatus.PENDING, 0, Duration.ofDays(40), parent);

        final var removed = taskService.cleanupExhaustedFailedTasks();

        assertThat(removed).isZero();
        assertThat(taskRepository.existsById(parent.getId())).isTrue();
    }
}
