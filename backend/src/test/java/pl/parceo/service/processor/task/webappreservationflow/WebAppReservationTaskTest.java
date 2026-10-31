package pl.parceo.service.processor.task.webappreservationflow;

import pl.parceo.exception.DateValidationException;
import pl.parceo.model.EmailData;
import pl.parceo.model.constant.ReservationStatus;
import pl.parceo.model.constant.SupportedLocale;
import pl.parceo.model.constant.TaskStatus;
import pl.parceo.model.constant.TaskType;
import pl.parceo.model.dto.CamperPlaceDTO;
import pl.parceo.model.dto.CamperPlaceTypeDTO;
import pl.parceo.model.dto.GuestDTO;
import pl.parceo.model.dto.ReservationDTO;
import pl.parceo.model.dto.UserDTO;
import pl.parceo.model.dto.WebAppReservationPayload;
import pl.parceo.model.entity.CamperPlace;
import pl.parceo.model.entity.CamperPlaceType;
import pl.parceo.model.entity.Guest;
import pl.parceo.model.entity.Reservation;
import pl.parceo.model.entity.Task;
import pl.parceo.service.core.GuestService;
import pl.parceo.service.core.ReservationService;
import pl.parceo.service.core.SearchCriteria;
import pl.parceo.service.processor.TaskService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WebAppReservationTaskTest {

    private static final String TARGET_ID = "target-1";
    private static final LocalDate CHECKIN = LocalDate.of(2027, 6, 1);
    private static final LocalDate CHECKOUT = LocalDate.of(2027, 6, 8);

    @Mock
    private ReservationService reservationService;
    @Mock
    private TaskService taskService;
    @Mock
    private GuestService guestService;

    @Test
    void failsTheTaskWhenTheReservationHasNoCreator() {
        final var entity = createWebAppReservationTaskEntity(new WebAppReservationPayload(reservationDto(guestDto(null), null), SupportedLocale.pl));
        final var task = new WebAppReservationTask(reservationService, taskService, guestService, entity);

        task.doTask();

        assertThat(entity.getTaskStatus()).isEqualTo(TaskStatus.FAILED);
        assertThat(entity.getStatusMessage()).isEqualTo("Reservation payload does not contains any creator");
        verifyNoInteractions(reservationService, taskService);
    }

    @Test
    void createsAnUnverifiedReservationWithHolderAndEmailChildrenForANewGuest() {
        final var entity = createWebAppReservationTaskEntity(new WebAppReservationPayload(reservationDto(guestDto(null), creatorDto()), SupportedLocale.pl));
        final var task = new WebAppReservationTask(reservationService, taskService, guestService, entity);

        when(guestService.findBy(any(SearchCriteria.class))).thenReturn(Page.empty());
        when(reservationService.create(any(ReservationDTO.class))).thenReturn(persistedReservation(100));

        task.doTask();

        final var dtoCaptor = ArgumentCaptor.forClass(ReservationDTO.class);
        verify(reservationService).create(dtoCaptor.capture());
        assertThat(dtoCaptor.getValue().reservationStatus()).isEqualTo(ReservationStatus.UNVERIFIED);
        verify(guestService, never()).update(any(Guest.class));

        final var taskCaptor = ArgumentCaptor.forClass(Task.class);
        verify(taskService, org.mockito.Mockito.times(2)).create(taskCaptor.capture());
        final var created = taskCaptor.getAllValues();

        final var holder = created.stream()
                .filter(t -> t.getTaskType() == TaskType.TEMPORARY_PAYLOAD_HOLDER_TASK)
                .findFirst().orElseThrow();
        assertThat(holder.getTaskStatus()).isEqualTo(TaskStatus.ON_HOLD);
        assertThat(holder.getTargetId()).isEqualTo(TARGET_ID);
        assertThat(holder.getPayload()).isEqualTo(100);

        final var email = created.stream()
                .filter(t -> t.getTaskType() == TaskType.SEND_EMAIL_AUTHENTICATION_TASK)
                .findFirst().orElseThrow();
        assertThat(email.getTargetId()).isEqualTo(TARGET_ID);
        assertThat(email.getPayload()).isInstanceOf(EmailData.class);
        assertThat(((EmailData) email.getPayload()).locale()).isEqualTo(SupportedLocale.pl);
    }

    @Test
    void reusesAnExistingGuestMatchedByEmail() {
        final var entity = createWebAppReservationTaskEntity(new WebAppReservationPayload(reservationDto(guestDto(null), creatorDto()), SupportedLocale.pl));
        final var task = new WebAppReservationTask(reservationService, taskService, guestService, entity);

        final var existingGuest = Guest.builder().id(7).email("ada@example.com").firstname("Ada").build();
        when(guestService.findBy(any(SearchCriteria.class)))
                .thenReturn(new PageImpl<>(List.of(existingGuest)));
        when(guestService.update(existingGuest)).thenReturn(existingGuest);
        when(reservationService.create(any(ReservationDTO.class))).thenReturn(persistedReservation(101));

        task.doTask();

        verify(guestService).update(existingGuest);
        final var dtoCaptor = ArgumentCaptor.forClass(ReservationDTO.class);
        verify(reservationService).create(dtoCaptor.capture());
        assertThat(dtoCaptor.getValue().guest().id()).isEqualTo(7);
    }

    @Test
    void whenAKnownGuestRetriesAfterADateClashItResendsTheEmailButAddsNoSecondHolder() {
        final var entity = createWebAppReservationTaskEntity(new WebAppReservationPayload(reservationDto(guestDto(7), creatorDto()), SupportedLocale.pl));
        final var task = new WebAppReservationTask(reservationService, taskService, guestService, entity);

        final var existingGuest = Guest.builder().id(7).email("ada@example.com").build();
        when(guestService.findBy(any(SearchCriteria[].class)))
                .thenReturn(new PageImpl<>(List.of(existingGuest)));
        when(guestService.update(existingGuest)).thenReturn(existingGuest);
        when(reservationService.create(any(ReservationDTO.class)))
                .thenThrow(new DateValidationException("Parcela jest już zajęta!"));
        when(reservationService.findBy(any(SearchCriteria[].class)))
                .thenReturn(new PageImpl<>(List.of(persistedReservation(55))));

        task.doTask();

        final var taskCaptor = ArgumentCaptor.forClass(Task.class);
        verify(taskService).create(taskCaptor.capture());
        assertThat(taskCaptor.getValue().getTaskType()).isEqualTo(TaskType.SEND_EMAIL_AUTHENTICATION_TASK);
        assertThat(taskCaptor.getAllValues())
                .noneMatch(t -> t.getTaskType() == TaskType.TEMPORARY_PAYLOAD_HOLDER_TASK);
    }

    @Test
    void propagatesTheDateClashWhenABrandNewGuestCannotBeMatchedToAnExistingReservation() {
        final var entity = createWebAppReservationTaskEntity(new WebAppReservationPayload(reservationDto(guestDto(null), creatorDto()), SupportedLocale.pl));
        final var task = new WebAppReservationTask(reservationService, taskService, guestService, entity);

        when(guestService.findBy(any(SearchCriteria.class))).thenReturn(Page.empty());
        when(reservationService.create(any(ReservationDTO.class)))
                .thenThrow(new DateValidationException("Parcela jest już zajęta!"));

        assertThatThrownBy(task::doTask).isInstanceOf(DateValidationException.class);

        verify(taskService, never()).create(any(Task.class));
    }

    // --- fixtures ---

    private Task createWebAppReservationTaskEntity(WebAppReservationPayload payload) {
        return Task.builder()
                .targetId(TARGET_ID)
                .payload(payload)
                .taskType(TaskType.WEB_APP_RESERVATION_TASK)
                .build();
    }

    private ReservationDTO reservationDto(GuestDTO guest, UserDTO creator) {
        return ReservationDTO.builder()
                .checkin(CHECKIN)
                .checkout(CHECKOUT)
                .guest(guest)
                .camperPlace(new CamperPlaceDTO(5, "A-1",
                        new CamperPlaceTypeDTO(1, "standard", BigDecimal.TEN), BigDecimal.TEN))
                .paid(false)
                .creator(creator)
                .build();
    }

    private GuestDTO guestDto(Integer id) {
        return new GuestDTO(id, "Ada", "Kowalska", "ada@example.com", "600700800", null, "PL");
    }

    private UserDTO creatorDto() {
        return new UserDTO(3, "web-app", "web@example.com", "WEB_APP");
    }

    private Reservation persistedReservation(int id) {
        return Reservation.builder()
                .id(id)
                .checkin(CHECKIN)
                .checkout(CHECKOUT)
                .camperPlace(CamperPlace.builder().id(6).index("1a").camperPlaceType(CamperPlaceType.builder().id(10).typeName("name").price(BigDecimal.valueOf(123)).build()).build())
                .guest(Guest.builder().id(7).email("ada@example.com").firstname("Ada").build())
                .reservationStatus(ReservationStatus.UNVERIFIED)
                .price(BigDecimal.valueOf(67))
                .build();
    }

}
