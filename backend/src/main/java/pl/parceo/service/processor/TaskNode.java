package pl.parceo.service.processor;

import pl.parceo.model.entity.Task;

import java.util.ArrayList;
import java.util.List;

public record TaskNode(Task task, List<TaskNode> subTasks) {
    public TaskNode(Task task) {
        this(task, new ArrayList<>());
    }

    public void addSubTask(Task task) {
        subTasks().add(new TaskNode(task, new ArrayList<>()));
    }
    public void addSubTask(TaskNode taskNode) {
        subTasks().add(taskNode);
    }
}