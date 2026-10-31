package pl.parceo;

import pl.parceo.controller.WebAppController;
import pl.parceo.model.constant.ReservationStatus;
import pl.parceo.model.constant.SupportedLocale;
import pl.parceo.model.constant.TaskStatus;
import pl.parceo.model.constant.TaskType;
import pl.parceo.model.dto.CamperPlaceDTO;
import pl.parceo.model.dto.CamperPlaceTypeDTO;
import pl.parceo.model.dto.GuestDTO;
import pl.parceo.model.dto.ReservationDTO;
import pl.parceo.model.entity.CamperPlace;
import pl.parceo.repository.ReservationRepository;
import pl.parceo.repository.TaskRepository;
import pl.parceo.service.core.CamperPlaceService;
import pl.parceo.service.core.CamperPlaceTypeService;
import pl.parceo.service.processor.TaskProcessor;
import pl.parceo.service.util.DtoMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.client.RestTestClient;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.verify;

/**
 * End-to-end coverage of the web-app reservation flow driven over HTTP with {@link RestTestClient}:
 * from {@code POST /web/reservation/init} through the async task processor to a VERIFIED reservation
 * after {@code POST /web/reservation/verify/{targetId}}. Processing is triggered explicitly via
 * {@link TaskProcessor#processTasks()} (see {@link BaseE2E} for why the scheduler is muted).
 */
class WebAppReservationE2EIT extends BaseE2E {

    private static final LocalDate CHECKIN = LocalDate.now().plusMonths(4);
    private static final LocalDate CHECKOUT = CHECKIN.plusDays(5);

    @Autowired private TaskProcessor taskProcessor;
    @Autowired private CamperPlaceTypeService camperPlaceTypeService;
    @Autowired private CamperPlaceService camperPlaceService;
    @Autowired private ReservationRepository reservationRepository;
    @Autowired private TaskRepository taskRepository;

    private CamperPlace camperPlace;

    @BeforeEach
    void setUpCamperPlace() {
        var type = camperPlaceTypeService.create(new CamperPlaceTypeDTO(null, "e2e-camperPlaceType", BigDecimal.valueOf(150)));
        camperPlace = camperPlaceService.create(new CamperPlaceDTO(null, "801",
                DtoMapper.getCamperPlaceTypeDTO(type), null));
    }

    // --- request helpers ---

    private RestTestClient.RequestHeadersSpec<?> initRequest(String orgId, String apiKey, GuestDTO guest) {
        var body = ReservationDTO.builder()
                .checkin(CHECKIN).checkout(CHECKOUT)
                .guest(guest)
                .camperPlace(new CamperPlaceDTO(camperPlace.getId(), camperPlace.getIndex(),
                        DtoMapper.getCamperPlaceTypeDTO(camperPlace.getCamperPlaceType()), BigDecimal.valueOf(150)))
                .paid(false)
                .build();
        return client.post().uri("/web/reservation/init")
                .header("X-org-id", orgId)
                .header("X-api-key", apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(new WebAppController.ResInitRequest(body, SupportedLocale.pl));
    }

    private GuestDTO guest() {
        return new GuestDTO(null, "E2E", "Guest", "e2e-guest@example.com", "600300400", null, "PL");
    }

    private String webAppReservationTaskTargetId() {
        return taskRepository.findAll().stream()
                .filter(t -> t.getTaskType() == TaskType.WEB_APP_RESERVATION_TASK)
                .findFirst().orElseThrow().getTargetId();
    }

    // --- tests ---

    @Test
    void happyPath_fromInitRequestToVerifiedReservation() {
        initRequest(orgId(), API_KEY, guest()).exchange().expectStatus().isOk();

        taskProcessor.processTasks(); // WEB_APP_RESERVATION_TASK

        assertThat(reservationRepository.findAll())
                .singleElement()
                .extracting(r -> r.getReservationStatus())
                .isEqualTo(ReservationStatus.UNVERIFIED);

        var targetId = webAppReservationTaskTargetId();

        taskProcessor.processTasks(); // SEND_EMAIL_AUTHENTICATION_TASK
        verify(novu.trigger(), atLeastOnce()).body(any());

        client.post().uri("/web/reservation/verify/{targetId}", targetId)
                .header("X-org-id", orgId())
                .header("X-api-key", API_KEY)
                .exchange()
                .expectStatus().isOk();

        taskProcessor.processTasks(); // RESERVATION_STATUS_VERIFIER_TASK

        assertThat(reservationRepository.findAll())
                .singleElement()
                .extracting(r -> r.getReservationStatus())
                .isEqualTo(ReservationStatus.VERIFIED);
    }

    @Test
    void verifyWithUnknownTargetIdFailsTheTaskAndLeavesNoVerifiedReservation() {
        client.post().uri("/web/reservation/verify/{targetId}", "target-that-never-existed")
                .header("X-org-id", orgId())
                .header("X-api-key", API_KEY)
                .exchange()
                .expectStatus().isOk();

        taskProcessor.processTasks();

        assertThat(taskRepository.findAll())
                .filteredOn(t -> t.getTaskType() == TaskType.RESERVATION_STATUS_VERIFIER_TASK)
                .singleElement()
                .extracting(t -> t.getTaskStatus())
                .isEqualTo(TaskStatus.FAILED);
        assertThat(reservationRepository.findAll())
                .noneMatch(r -> r.getReservationStatus() == ReservationStatus.VERIFIED);
    }

    @Test
    void repeatedInitForTheSameGuestAndDatesResultsInASingleReservation() {
        initRequest(orgId(), API_KEY, guest()).exchange().expectStatus().isOk();
        taskProcessor.processTasks();

        initRequest(orgId(), API_KEY, guest()).exchange().expectStatus().isOk();
        taskProcessor.processTasks();

        assertThat(reservationRepository.findAll()).hasSize(1);
    }
}
