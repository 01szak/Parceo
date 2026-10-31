package pl.parceo.service.processor;

import pl.parceo.model.constant.TaskStatus;
import pl.parceo.model.constant.TaskType;
import pl.parceo.model.entity.Task;
import pl.parceo.repository.CRUDRepository;
import pl.parceo.repository.TaskRepository;
import pl.parceo.service.core.CRUDServiceImpl;
import jakarta.annotation.Nullable;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class TaskService extends CRUDServiceImpl {

    @Value("${parceo.task.max-retry-count}")
    private long MAX_RETRY_COUNT;

    @Value("${parceo.task.cleanup-task.payload-holder-ttl}")
    private Duration payloadHolderTaskTtl;

    @Value("${parceo.task.cleanup-task.failed-task-ttl}")
    private Duration exhaustedFailedTaskTtl;

    private final TaskRepository taskRepository;

    @Override
    protected CRUDRepository getRepository() {
        return taskRepository;
    }

    public List<Task> getExecutableTasks() {
        return taskRepository.getExecutableTasks(MAX_RETRY_COUNT);
    }

    public List<Task> getInProgressTask() {
        return taskRepository.getAllByTaskStatus(TaskStatus.IN_PROGRESS);
    }

    public @Nullable Task findPayloadHolderTaskByTargetId(String targetId) {
        final var result = taskRepository.findAllByTargetIdAndTaskType(targetId, TaskType.TEMPORARY_PAYLOAD_HOLDER_TASK);
        if (result.size() > 1) {
            result.forEach(task -> {
                task.setTaskStatus(TaskStatus.FAILED);
                task.setStatusMessage("Invalid targetId was mapped risking more then one payload to be verified");
            });
            super.update(result);
            //TODO consider creating exception that covers unexpected scenarios
            log.error("Unexpected scenario: Invalid targetId was mapped risking more then one payload to be verified");
            throw new IllegalStateException("Only one payload holder task should be mapped to specific TargetId");
        }
        return result.isEmpty() ? null : result.getFirst();
    }

    /**
     * Removes payload-holder tasks that have been sitting around for at least
     * {@code parceo.task.cleanup-task.payload-holder-ttl} (a guest never confirmed the reservation).
     */
    public int cleanupStalePayloadHolderTasks() {
        final var cutoff = Date.from(Instant.now().minus(payloadHolderTaskTtl));
        final var ids = taskRepository.findDeletableTaskIdsByType(TaskType.TEMPORARY_PAYLOAD_HOLDER_TASK, cutoff);
        if (ids.isEmpty()) {
            return 0;
        }
        taskRepository.deleteAllByIdInBatch(ids);
        log.info("Task cleanup: removed {} {} task(s) older than {}",
                ids.size(), TaskType.TEMPORARY_PAYLOAD_HOLDER_TASK, payloadHolderTaskTtl);
        return ids.size();
    }

    /**
     * Removes FAILED tasks that will never be retried again (not retryable, or retry limit reached)
     * and are older than {@code parceo.task.cleanup-task.failed-task-ttl}.
     */
    public int cleanupExhaustedFailedTasks() {
        final var cutoff = Date.from(Instant.now().minus(exhaustedFailedTaskTtl));
        final var ids = taskRepository.findDeletableExhaustedFailedTaskIds(MAX_RETRY_COUNT, cutoff);
        if (ids.isEmpty()) {
            return 0;
        }
        taskRepository.deleteAllByIdInBatch(ids);
        log.info("Task cleanup: removed {} exhausted FAILED task(s) older than {}", ids.size(), exhaustedFailedTaskTtl);
        return ids.size();
    }
}
