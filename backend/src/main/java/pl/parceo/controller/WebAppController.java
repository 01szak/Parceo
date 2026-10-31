package pl.parceo.controller;

import pl.parceo.model.constant.SupportedLocale;
import pl.parceo.model.constant.TaskType;
import pl.parceo.model.dto.ReservationDTO;
import pl.parceo.model.dto.WebAppReservationPayload;
import pl.parceo.model.entity.Task;
import pl.parceo.model.entity.User;
import pl.parceo.service.core.UserService;
import pl.parceo.service.processor.TaskService;
import pl.parceo.service.util.DtoMapper;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.enums.ParameterIn;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

import static pl.parceo.model.constant.TaskType.WEB_APP_RESERVATION_TASK;

@RestController
@RequestMapping("/web")
@RequiredArgsConstructor
public class WebAppController {

    private final TaskService taskService;
    private final UserService userService;

    public record ResInitRequest(@NotNull ReservationDTO reservationDTO, @NotNull SupportedLocale locale) {}

    @PostMapping("/reservation/init")
    @Parameter(in = ParameterIn.HEADER, name = "X-org-id", required = true)
    @Parameter(in = ParameterIn.HEADER, name = "X-api-key", required = true)
    public ResponseEntity<String> createUnverifiedReservationAndSendAuthenticationEmail(@RequestBody @Valid ResInitRequest request) {
        final var webAppUserName = SecurityContextHolder.getContext().getAuthentication().getName();
        final var webAppUSer = (User) userService.loadUserByUsername(webAppUserName);
        final var payload = new WebAppReservationPayload(
                request.reservationDTO().toBuilder().creator(DtoMapper.getUserDTO(webAppUSer)).build(), request.locale());
        final var task = Task.builder()
                .targetId(UUID.randomUUID().toString())
                .payload(payload)
                .taskType(WEB_APP_RESERVATION_TASK)
                .parentTask(null)
                .build();
        taskService.create(task);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/reservation/verify/{targetId}")
    @Parameter(in = ParameterIn.HEADER, name = "X-org-id", required = true)
    @Parameter(in = ParameterIn.HEADER, name = "X-api-key", required = true)
    public ResponseEntity<String> verifyReservation(@PathVariable @NotNull String targetId) {
        final var task = Task.builder().targetId(targetId).taskType(TaskType.RESERVATION_STATUS_VERIFIER_TASK).build();
        taskService.create(task);
        return ResponseEntity.ok().build();
    }

}
