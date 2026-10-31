package pl.parceo.service.processor;


import pl.parceo.model.constant.TaskStatus;
import pl.parceo.model.entity.Task;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.Executors;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static pl.parceo.model.constant.TaskStatus.EXECUTED;
import static pl.parceo.model.constant.TaskStatus.FAILED;
import static pl.parceo.model.constant.TaskStatus.IN_PROGRESS;
import static pl.parceo.model.constant.TaskStatus.PENDING;

@Log4j2
@Service
@RequiredArgsConstructor
public class TaskProcessor {

    @Value("${parceo.task.max-retry-count}")
    private long MAX_RETRY_COUNT;

    private final TaskService taskService;
    private final ExecutableTaskFactory executableTaskFactory;

    @Scheduled(fixedDelayString = "${parceo.task.process-tasks.fixed-delay}")
    public void processTasks() {
        final var pendingTasks = taskService.getExecutableTasks();

        if (pendingTasks.isEmpty()) {
            return;
        }

        increaseRetryCountAndSetStatusToPending(pendingTasks);

        final var taskForest = getTaskForest(pendingTasks);

        try(final var executor =  Executors.newVirtualThreadPerTaskExecutor()) {
            log.info("{} pending tasks found", pendingTasks.size());
            taskForest.forEach(node -> {
                executor.submit(() -> executeTaskNode(node));
            });
        } catch (Exception e) {
            log.error("Exception occurred while processing the tasks: {} {}", e.getLocalizedMessage(), Arrays.toString(e.getStackTrace()));
            final var inProgressTasks = taskService.getInProgressTask();
            taskService.update(inProgressTasks.stream().map(t -> mapTaskStatus(t, FAILED, e.getLocalizedMessage())).toList());
        }
    }

    private List<TaskNode> getTaskForest(List<Task> pendingTasks) {
        final var taskForest = pendingTasks.stream()
                .gather(TaskGatherer.createTaskForest())
                .collect(Collectors.toCollection(ArrayList::new));
        final var failedTaskNodes = taskForest.stream()
                .filter(tn -> FAILED.equals(tn.task().getTaskStatus()))
                .flatMap(this::flattenNode)
                .collect(Collectors.toCollection(ArrayList::new));

        if (!failedTaskNodes.isEmpty()) {
            taskForest.removeAll(failedTaskNodes);
            taskService.update(failedTaskNodes.stream().map(TaskNode::task).toList());
        }
        return taskForest;
    }

    private void executeTaskNode(TaskNode taskNode) {
        try {
            log.info("Starting to process task: {} ", taskNode.task().getTaskType());
            taskService.update(mapTaskStatus(taskNode.task(), IN_PROGRESS));

            executableTaskFactory.getExecutableTask(taskNode.task()).doTask();

            if (FAILED.equals(taskNode.task().getTaskStatus())) {
                //if task failed while being processed we just stop executing the rest of the tree
                taskService.update(taskNode.task());
                failDescendants(taskNode);
                return;
            }

            taskService.update(mapTaskStatus(taskNode.task(), EXECUTED));
            log.info("task: {} executed successfully", taskNode.task().getTaskType());

            if (taskNode.subTasks().isEmpty()) return;

            try(final var executor =  Executors.newVirtualThreadPerTaskExecutor()) {
                taskNode.subTasks().forEach(subTask -> {
                    executor.submit(() -> {
                        executeTaskNode(subTask);
                    });
                });

            }

        } catch (Exception e) {
            log.error("Exception occurred while processing the task: {} \n{} \n{}", taskNode.task().getTaskType(), e.getLocalizedMessage(), Arrays.toString(e.getStackTrace()));
            taskService.update(mapTaskStatus(taskNode.task(), FAILED, e.getMessage()));
            failDescendants(taskNode);
        }
    }

    private void failDescendants(TaskNode taskNode) {
        taskNode.subTasks().forEach(s -> {
            log.warn("Skipping child task {} with ID {} because parent task failed", s.task().getTaskType(), s.task().getId());
            taskService.update(mapTaskStatus(s.task(), FAILED));
            failDescendants(s);

        });
    }

    private void increaseRetryCountAndSetStatusToPending(List<Task> pendingTasks) {
        pendingTasks.stream()
                .filter(t -> FAILED.equals(t.getTaskStatus()))
                .forEach(t -> t.setRetryCount(t.getRetryCount() + 1));

        pendingTasks.forEach(t -> {
            if (t.getRetryCount() > MAX_RETRY_COUNT) {
                t.setTaskStatus(FAILED);
                t.setStatusMessage("Retry count exceeded the maximum of " + MAX_RETRY_COUNT);
                log.warn(
                        "Task {} with ID {} permanently failed - retry count {} exceeded the maximum of {}",
                        t.getTaskType(), t.getId(), t.getRetryCount(), MAX_RETRY_COUNT
                );
            } else {
                t.setTaskStatus(PENDING);
            }
        });
    }

    private <T extends Task> T mapTaskStatus(T task, TaskStatus taskStatus, String statusMessage) {
        task.setTaskStatus(taskStatus);
        task.setStatusMessage(statusMessage);
        return task ;
    }

    private <T extends Task> T mapTaskStatus(T task, TaskStatus taskStatus) {
        return mapTaskStatus(task, taskStatus, null);
    }

    private Stream<TaskNode> flattenNode(TaskNode node) {
        return Stream.concat(
                Stream.of(node),
                node.subTasks().stream().flatMap(this::flattenNode)
        );
    }
}
