package pl.parceo.service.processor;

import pl.parceo.model.constant.TaskStatus;
import pl.parceo.model.entity.Task;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Gatherer;

public class TaskGatherer {

    public static Gatherer<Task, Map<Integer, TaskNode>, TaskNode> createTaskForest() {
        return Gatherer.ofSequential(
                HashMap::new,
                (map, task, _) -> {
                    map.put(task.getId(), new TaskNode(task));
                    return true;
                },
                (map, downstream) -> {
                    final var roots = new ArrayList<TaskNode>();

                    map.values().forEach(taskNode -> {
                        final var parent = taskNode.task().getParentTask();

                        Optional.ofNullable(parent).ifPresentOrElse(parentTask -> {
                            if (map.containsKey(parentTask.getId())) {
                                final var parentTaskNode = map.get(parentTask.getId());
                                if (TaskStatus.FAILED.equals(parentTaskNode.task().getTaskStatus())) {
                                    taskNode.task().setTaskStatus(TaskStatus.FAILED);
                                }
                                parentTaskNode.addSubTask(taskNode);
                            } else {
                                taskNode.task().setTaskStatus(TaskStatus.FAILED);
                                taskNode.task().setStatusMessage("No parent task available in the current task stream");
                                roots.add(taskNode);
                            }
                        }, () -> {
                            roots.add(taskNode);
                        });

                    });

                    roots.forEach(downstream::push);
                }
        );
    }
}
