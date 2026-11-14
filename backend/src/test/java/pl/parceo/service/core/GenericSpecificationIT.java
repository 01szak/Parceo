package pl.parceo.service.core;

import pl.parceo.BaseIT;
import pl.parceo.exception.ClientSideException;
import pl.parceo.exception.UserInputException;
import pl.parceo.model.constant.Country;
import pl.parceo.model.constant.Operation;
import pl.parceo.model.dto.CamperPlaceDTO;
import pl.parceo.model.dto.CamperPlaceTypeDTO;
import pl.parceo.model.dto.GuestDTO;
import pl.parceo.model.dto.ReservationDTO;
import pl.parceo.model.entity.Guest;
import pl.parceo.model.entity.Organisation;
import pl.parceo.model.entity.Reservation;
import pl.parceo.model.entity.Task;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import pl.parceo.service.util.DtoMapper;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.concurrent.Callable;
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.fail;
import static pl.parceo.model.constant.TaskType.WEB_APP_RESERVATION_TASK;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class GenericSpecificationIT extends BaseIT {

    private static final String CP_TYPE = "type";
    private static final BigDecimal CP_TYPE_PRICE = BigDecimal.valueOf(123);
    private static final String CP_INDEX = "1u";
    private static final String GUEST_FN = "guestFirstname";
    private static final String GUEST_LN = "guestLastname";
    private static final Country COUNTRY = Country.POLAND;
    private static final LocalDate CHECKIN = LocalDate.parse("3026-01-01");
    private static final LocalDate CHECKOUT = LocalDate.parse("3026-01-10");
    private static final boolean IS_PAID = true;
    private static final String GUEST_LN_2 = "guestLastname_2";

    private static Reservation reservation = null;

    @BeforeEach
    void prepareData() {
        reservation = createReservationWithNewData(
                CP_TYPE,
                CP_TYPE_PRICE,
                CP_INDEX,
                GUEST_FN,
                GUEST_LN,
                COUNTRY,
                CHECKIN,
                CHECKOUT,
                IS_PAID
        );
    }

    @AfterEach
    void deleteData() {
        reservationService.delete(reservation);
    }

    @Test
    void shouldReturnDataWithEqualOperation() {
        // given
        var criteria = SearchCriteria.builder().object(new SearchCriteria.Join("firstname")).operation(Operation.EQUALS).value(GUEST_FN).buildArray();

        // when
        var result = guestService.findBy(criteria).get().toList();

        //then
        assertThat(result.size()).isEqualTo(1);
        assertThat(result.getFirst().getFirstname()).isEqualTo(GUEST_FN);
    }

    @Test
    void shouldReturnDataFilteredByMultipleCriteria() {
        // given
        var criteria = SearchCriteria.builder()
                .object(new SearchCriteria.Join("firstname")).operation(Operation.EQUALS).value(GUEST_FN)
                .and()
                .object(new SearchCriteria.Join("lastname")).operation(Operation.NOT_EQUALS).value(GUEST_LN_2)
                .buildArray();

        // when
        var result = guestService.findBy(criteria).get().toList();

        //then
        assertThat(result.size()).isEqualTo(1);
        assertThat(result.getFirst().getFirstname()).isEqualTo(GUEST_FN);
    }


    @Test
    void shouldReturnDataFilteredByLessThenOperation() {
        // given
        var criteria = SearchCriteria.builder().object(new SearchCriteria.Join("checkin")).operation(Operation.LESS_THEN).value(CHECKIN.plusDays(1).toString()).buildArray();

        // when
        var result = reservationService.findBy(criteria).get().toList();

        // then
        assertThat(result.size()).isGreaterThan(0);
        assertThat(result.stream().filter(r -> Objects.equals(reservation.getId(), r.getId())).count()).isEqualTo(1);
    }

    @Test
    void shouldReturnDataFilteredByGreaterThenOperation() {
        // given
        var criteria = SearchCriteria.builder().object(new SearchCriteria.Join("checkin")).operation(Operation.GREATER_THEN).value(CHECKIN.minusDays(1).toString()).buildArray();

        // when
        var result = reservationService.findBy(criteria).get().toList();

        // then
        assertThat(result.size()).isGreaterThan(0);
        assertThat(result.stream().filter(r -> Objects.equals(reservation.getId(), r.getId())).count()).isEqualTo(1);
    }

    @Test
    void shouldReturnDataFilteredByBetweenOperation() {
        // given
        var criteria = SearchCriteria.builder()
                .object(new SearchCriteria.Join("checkin"))
                .operation(Operation.BETWEEN)
                .value(CHECKIN.minusDays(1).toString())
                .secondValue(CHECKOUT.plusDays(1).toString())
                .buildArray();

        // when
        var result = reservationService.findBy(criteria).get().toList();

        // then
        assertThat(result.size()).isGreaterThan(0);
        assertThat(result.stream().filter(r -> Objects.equals(r.getId(), reservation.getId())).count()).isEqualTo(1);
    }

    @Test
    void shouldReturnDataFilteredByLikeOperation() {
        // given
        var criteria = SearchCriteria.builder().object(new SearchCriteria.Join("firstname")).operation(Operation.LIKE).value("stFir").buildArray();

        // when
        var result = guestService.findBy(criteria).get().toList();

        // then
        assertThat(result.size()).isGreaterThan(0);
        assertThat(result.stream().filter(g -> GUEST_FN.equals(g.getFirstname())).count()).isEqualTo(1);
    }

    @Test
    void shouldReturnDataWithJoinAndMultipleCriteria() {
        // given
        var criteria = SearchCriteria.builder()
                .object(new SearchCriteria.Join("guest", new SearchCriteria.Join("firstname"))).operation(Operation.LIKE).value(GUEST_FN)
                .and()
                .object(new SearchCriteria.Join("guest", new SearchCriteria.Join("lastname"))).operation(Operation.LIKE).value(GUEST_LN)
                .buildArray();

        // when
        var result = reservationService.findBy(criteria).get().toList();

        // then
        assertThat(result.size()).isEqualTo(1);

        var actuallGuest = result.getFirst().getGuest();
        assertThat(GUEST_FN.equals(actuallGuest.getFirstname())).isTrue();
    }

    @Test
    void shouldReturnDataFilteredByBigDecimalOperation() {
        // given
        var criteria = SearchCriteria.builder().object(new SearchCriteria.Join("price")).operation(Operation.EQUALS).value(reservation.getPrice().toString()).buildArray();

        // when
        var result = reservationService.findBy(criteria).get().toList();

        // then
        assertThat(result.size()).isGreaterThan(0);
        assertThat(result.stream().anyMatch(r -> Objects.equals(r.getId(), reservation.getId()))).isTrue();
    }

    @Test
    void shouldReturnDataFilteredByBooleanOperation() {
        // given
        var criteria = SearchCriteria.builder().object(new SearchCriteria.Join("paid")).operation(Operation.EQUALS).value(String.valueOf(IS_PAID)).buildArray();

        // when
        var result = reservationService.findBy(criteria).get().toList();

        // then
        assertThat(result.size()).isGreaterThan(0);
        assertThat(result.stream().anyMatch(r -> Objects.equals(r.getId(), reservation.getId()))).isTrue();
    }

    @Test
    void shouldReturnDataFilteredByIntegerOperation() {
        // given
        var criteria = SearchCriteria.builder().object(new SearchCriteria.Join("id")).operation(Operation.EQUALS).value(reservation.getId().toString()).buildArray();

        // when
        var result = reservationService.findBy(criteria).get().toList();

        // then
        assertThat(result.size()).isEqualTo(1);
        assertThat(result.getFirst().getId()).isEqualTo(reservation.getId());
    }

    @Test
    void shouldReturnDataFilteredByEnumOperation() {
        // given
        var criteria = SearchCriteria.builder().object(new SearchCriteria.Join("reservationStatus")).operation(Operation.EQUALS).value(reservation.getReservationStatus().name()).buildArray();

        // when
        var result = reservationService.findBy(criteria).get().toList();

        // then
        assertThat(result.size()).isGreaterThan(0);
        assertThat(result.stream().anyMatch(r -> Objects.equals(r.getId(), reservation.getId()))).isTrue();
    }

    @Test
    void shouldReturnDataWithNotEqualOperation() {
        // given
        var criteria = SearchCriteria.builder().object(new SearchCriteria.Join("firstname")).operation(Operation.NOT_EQUALS).value("NonExistentName").buildArray();

        // when
        var result = guestService.findBy(criteria).get().toList();

        // then
        assertThat(result.size()).isGreaterThan(0);
        assertThat(result.stream().anyMatch(g -> GUEST_FN.equals(g.getFirstname()))).isTrue();
    }

    @Test
    void shouldMatchLikeOperationCaseInsensitively() {
        // given
        var criteria = SearchCriteria.builder().object(new SearchCriteria.Join("firstname")).operation(Operation.LIKE).value("GuEsTfIrStNaMe").buildArray();

        // when
        var result = guestService.findBy(criteria).get().toList();

        // then
        assertThat(result.size()).isEqualTo(1);
        assertThat(result.getFirst().getFirstname()).isEqualTo(GUEST_FN);
    }

    @Test
    void shouldReturnEmptyWhenNoMatchesFound() {
        // given
        var criteria = SearchCriteria.builder().object(new SearchCriteria.Join("firstname")).operation(Operation.EQUALS).value("ThisNameDoesNotExistInAnyRecord").buildArray();

        // whenresult = {ImmutableCollections$ListN@21584}  size = 1
        var result = guestService.findBy(criteria).get().toList();

        // then
        assertThat(result.size()).isEqualTo(0);
    }

    // --- Multiple Joining Operators Tests (a OR b OR c, (a AND b) OR c, (y AND z) OR x) ---

    @Test
    void shouldReturnDataWithAllOrJoinOperators() {
        // given (a or b or c)
        final var guestA = createGuest("Alice", "Alpha", Country.POLAND);
        final var guestB = createGuest("Bob", "Beta", Country.POLAND);
        final var guestC = createGuest("Charlie", "Gamma", Country.POLAND);

        final var criteria = SearchCriteria.builder()
                .object(new SearchCriteria.Join("firstname")).operation(Operation.EQUALS).value("Alice")
                .or()
                .object(new SearchCriteria.Join("firstname")).operation(Operation.EQUALS).value("Bob")
                .or()
                .object(new SearchCriteria.Join("firstname")).operation(Operation.EQUALS).value("Charlie")
                .or()
                .buildArray();

        // when
        final var result = guestService.findBy(criteria).getContent();

        // then
        final var firstNames = result.stream().map(g -> g.getFirstname()).toList();
        assertThat(firstNames).contains("Alice", "Bob", "Charlie");
    }

    @Test
    void shouldReturnDataWithAndThenOrJoinOperators() {
        // given ((a and b) or c)
        final var guestA = createGuest("David", "Delta", Country.POLAND);
        final var guestB = createGuest("Eva", "Echo", Country.POLAND);

        // Subcase 1: Matching (David AND Delta) OR (NonExistent)
        final var criteria1 = SearchCriteria.builder()
                .object(new SearchCriteria.Join("firstname")).operation(Operation.EQUALS).value("David")
                .and()
                .object(new SearchCriteria.Join("lastname")).operation(Operation.EQUALS).value("Delta")
                .and()
                .object(new SearchCriteria.Join("firstname")).operation(Operation.EQUALS).value("NonExistent")
                .or()
                .buildArray();

        final var result1 = guestService.findBy(criteria1).getContent();
        assertThat(result1.stream().anyMatch(g -> "David".equals(g.getFirstname()) && "Delta".equals(g.getLastname()))).isTrue();

        // Subcase 2: Matching (David AND WrongLastName) OR (Eva) -> (false) OR true -> returns Eva
        final var criteria2 = SearchCriteria.builder()
                .object(new SearchCriteria.Join("firstname")).operation(Operation.EQUALS).value("David")
                .and()
                .object(new SearchCriteria.Join("lastname")).operation(Operation.EQUALS).value("WrongLastName")
                .and()
                .object(new SearchCriteria.Join("firstname")).operation(Operation.EQUALS).value("Eva")
                .or()
                .buildArray();

        final var result2 = guestService.findBy(criteria2).getContent();
        final var result2Names = result2.stream().map(g -> g.getFirstname()).toList();
        assertThat(result2Names).contains("Eva");
        assertThat(result2Names).doesNotContain("David");
    }

    @Test
    void shouldReturnDataWithXOrYAndZJoinOperators() {
        // given (x or (y and z)) structured as (y and z) or x
        final var guestY = createGuest("Frank", "Foxtrot", Country.POLAND);
        final var guestX = createGuest("Grace", "Golf", Country.POLAND);

        // (Frank AND Foxtrot) OR Grace
        final var criteria = SearchCriteria.builder()
                .object(new SearchCriteria.Join("firstname")).operation(Operation.EQUALS).value("Frank")
                .and()
                .object(new SearchCriteria.Join("lastname")).operation(Operation.EQUALS).value("Foxtrot")
                .and()
                .object(new SearchCriteria.Join("firstname")).operation(Operation.EQUALS).value("Grace")
                .or()
                .buildArray();

        final var result = guestService.findBy(criteria).getContent();
        final var matchedNames = result.stream().map(g -> g.getFirstname()).toList();
        assertThat(matchedNames).contains("Frank", "Grace");
    }

    @Test
    void shouldThrowClientSideExceptionWhenSearchingByInvalidProperty() {
        // given
        final var criteria = SearchCriteria.builder().object(new SearchCriteria.Join("nonExistentProperty")).operation(Operation.EQUALS).value("value").buildArray();

        // when & then
        assertThatThrownBy(() -> guestService.findBy(criteria))
                .isInstanceOf(ClientSideException.class);
    }

    @Test
    void shouldThrowClientSideExceptionWhenJoiningInvalidRelation() {
        // given
        final var criteria = SearchCriteria.builder().object(new SearchCriteria.Join("invalidRelation", new SearchCriteria.Join("some-field"))).operation(Operation.EQUALS).value("value").buildArray();

        // when & then
        assertThatThrownBy(() -> reservationService.findBy(criteria))
                .isInstanceOf(ClientSideException.class);
    }

    @Test
    void shouldThrowUserInputExceptionWhenDateFormatIsInvalid() {
        // given
        final var criteria = SearchCriteria.builder().object(new SearchCriteria.Join("checkin")).operation(Operation.EQUALS).value("invalid-date-format").buildArray();

        // when & then
        assertThatThrownBy(() -> reservationService.findBy(criteria))
                .isInstanceOf(UserInputException.class)
                .hasMessage("Nieprawidłowa data!");
    }

    @Test
    void shouldThrowClientSideExceptionWhenBetweenOperationHasNullSecondValue() {
        // given
        final var criteria = new SearchCriteria(new SearchCriteria.Join("checkin"), Operation.BETWEEN, "3026-01-01", null, null);

        // when & then
        assertThatThrownBy(() -> reservationService.findBy(criteria))
                .isInstanceOf(ClientSideException.class)
                .hasMessage("second values cannot be null while using between operation");
    }

    @Test
    void shouldReturnDataFilteredByNumericBetweenOperation() {
        // given
        final var criteria = SearchCriteria.builder()
                .object(new SearchCriteria.Join("price"))
                .operation(Operation.BETWEEN)
                .value("1.00")
                .secondValue("100000.00")
                .buildArray();

        // when
        final var result = reservationService.findBy(criteria).getContent();

        // then
        assertThat(result).isNotEmpty();
        assertThat(result.stream().anyMatch(r -> Objects.equals(r.getId(), reservation.getId()))).isTrue();
    }

    @Test
    void shouldReturnDataFilteredByNumericGreaterThanAndLessThan() {
        // given
        final var criteria = SearchCriteria.builder()
                .object(new SearchCriteria.Join("price")).operation(Operation.GREATER_THEN).value("1.00")
                .and()
                .object(new SearchCriteria.Join("price")).operation(Operation.LESS_THEN).value("100000.00")
                .buildArray();

        // when
        final var result = reservationService.findBy(criteria).getContent();

        // then
        assertThat(result).isNotEmpty();
        assertThat(result.stream().anyMatch(r -> Objects.equals(r.getId(), reservation.getId()))).isTrue();
    }

    @Test
    void shouldReturnDataFilteredByLocalDateTimeGreaterThanAndLessThan() {
        // given
        final var task = taskService.create(Task.builder().taskType(WEB_APP_RESERVATION_TASK).targetId("dummyID").executionDate(LocalDateTime.parse("2067-01-02T01:00:00")).build());

        final var criteria = SearchCriteria.builder()
                .object(new SearchCriteria.Join("executionDate")).operation(Operation.GREATER_THEN).value("2067-01-01T01:00:00")
                .and()
                .object(new SearchCriteria.Join("executionDate")).operation(Operation.LESS_THEN).value("2067-01-03T01:00:00")
                .buildArray();

        // when
        final var result = (Task) taskService.findBy(criteria).get().findFirst().get();

        // then
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(task.getId());
    }

    @Test
    void shouldReturnAllRecordsWhenCriteriaArrayIsEmpty() {
        // when
        final var result = guestService.findBy().getContent();

        // then
        assertThat(result).isNotEmpty();
    }

    @Test
    void shouldReturnAllRecordsWhenCriteriaHasEmptyKey() {
        // given
        final var criteria = SearchCriteria.builder().object(new SearchCriteria.Join("")).operation(Operation.EQUALS).value("someValue").buildArray();

        // when
        final var result = guestService.findBy(criteria).getContent();

        // then
        assertThat(result).isNotEmpty();
    }

    @Test
    void shouldReturnNestedJoinQueryResult() {
        // given
        final var camperPlaceType = createCpType("cpType", BigDecimal.TEN);
        final var camperPlace = createCamperPlace("67", camperPlaceType);
        final var guest = createGuest("Nested", "Join", Country.POLAND);
        final var created = createReservation(camperPlace, LocalDate.now().plusDays(30), LocalDate.now().plusDays(31), guest, false);
        final var criteria = SearchCriteria.builder()
                .object(
                        new SearchCriteria.Join("camperPlace",
                                new SearchCriteria.Join("camperPlaceType",
                                        new SearchCriteria.Join("typeName")
                                )
                        )
                )
                .operation(Operation.EQUALS)
                .value("cpType")
                .buildArray();

        // when
        final var result = reservationService.findBy(criteria).getContent();

        // then
        assertThat(result).isNotEmpty();
        assertThat(result.stream().anyMatch(r -> Objects.equals(r.getId(), created.getId()))).isTrue();
    }
}
