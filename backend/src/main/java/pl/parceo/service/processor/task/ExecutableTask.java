package pl.parceo.service.processor.task;

import tools.jackson.databind.ObjectMapper;

public interface ExecutableTask {
    ObjectMapper objectMapper = new ObjectMapper();
    void doTask();
}
