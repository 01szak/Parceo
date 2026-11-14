package pl.parceo.service.core;

import pl.parceo.BaseIT;
import pl.parceo.exception.UserInputException;
import pl.parceo.model.constant.Country;
import pl.parceo.model.constant.Operation;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

public class CamperPlaceServiceIT extends BaseIT {

    @Test
    public void shouldReturnOccupiedDates() {
        final var checkin = LocalDate.parse("2030-05-01");
        final var checkout = LocalDate.parse("2030-05-05");

        final var reservation = createReservationWithNewData(
                "1_CS_IT_TYPE",
                BigDecimal.valueOf(100),
                "1_CS_IT_CP",
                "Jan",
                "Kowalski",
                Country.POLAND,
                checkin,
                checkout,
                false
        );

        final var expected = List.of(checkin.datesUntil(checkout).toList());
        final var result = camperPlaceService.getOccupiedDates(reservation.getCamperPlace().getId());

        assertThat(result).isEqualTo(expected);
    }

    @Test
    public void shouldAllowBackToBackReservationsWhereCheckoutIsCheckinOfNext() {
        // given
        final var cpName = "2_CS_IT_CP";
        final var res1Checkin = LocalDate.parse("2030-06-01");
        final var res1Checkout = LocalDate.parse("2030-06-05");

        final var res1 = createReservationWithNewData(
                "2_CS_IT_TYPE", BigDecimal.valueOf(100), "2_CS_IT_CP", "Jan", "Kowalski", Country.POLAND, res1Checkin, res1Checkout, false
        );

        final var res2Checkin = res1Checkout;
        final var res2Checkout = LocalDate.parse("2030-06-10");

        // when & then
        final var camperPlace = camperPlaceService.findBy(SearchCriteria.builder().object(new SearchCriteria.Join("index")).operation(Operation.LIKE).value("2_CS_IT_CP").buildArray()).getContent().getFirst();
        final var guest = guestService.findBy(SearchCriteria.builder().object(new SearchCriteria.Join("firstname")).operation(Operation.LIKE).value("Jan").and().object(new SearchCriteria.Join("lastname")).operation(Operation.LIKE).value("Kowalski").buildArray()).getContent().getFirst();

        createReservation(camperPlace, res2Checkin, res2Checkout, guest, false);

        final var occupiedDates = camperPlaceService.getOccupiedDates(res1.getCamperPlace().getId());

        // each reservation occupies its own nights only (checkin inclusive, checkout exclusive)
        assertThat(occupiedDates).containsExactly(
                res1Checkin.datesUntil(res1Checkout).toList(),
                res2Checkin.datesUntil(res2Checkout).toList()
        );
        assertThat(occupiedDates.getFirst()).doesNotContain(res1Checkout);
    }

    @Test
    public void shouldThrowExceptionWhenReservationDatesOverlapWithExisting() {
        // given
        final var existingCheckin = LocalDate.parse("2030-07-01");
        final var existingCheckout = LocalDate.parse("2030-07-10");

        createReservationWithNewData(
                "5_CS_IT_CP", BigDecimal.valueOf(100), "3_CS_IT_CP", "Jan", "Kowalski", Country.POLAND, existingCheckin, existingCheckout, false
        );

        final var overlappingCheckin = LocalDate.parse("2030-07-05");
        final var overlappingCheckout = LocalDate.parse("2030-07-15");

        final var camperPlace = camperPlaceService.findBy(SearchCriteria.builder().object(new SearchCriteria.Join("index")).operation(Operation.LIKE).value("3_CS_IT_CP").buildArray()).getContent().getFirst();
        final var guest = guestService.findBy(SearchCriteria.builder().object(new SearchCriteria.Join("firstname")).operation(Operation.LIKE).value("Jan").and().object(new SearchCriteria.Join("lastname")).operation(Operation.LIKE).value("Kowalski").buildArray()).getContent().getFirst();

        // when & then
        assertThatThrownBy(() -> {
            createReservation(camperPlace, overlappingCheckin, overlappingCheckout, guest, false);
        }).isInstanceOf(UserInputException.class);
    }

    @Test
    public void shouldIgnoreItsOwnDatesWhenUpdatingExistingReservation() {
        // given
        final var cpName = "7_CS_IT_CP";
        final var checkin = LocalDate.parse("2030-08-01");
        final var checkout = LocalDate.parse("2030-08-10");

        final var reservation = createReservationWithNewData(
                "8_CS_IT_TYPE", BigDecimal.valueOf(100), cpName, "Jan", "Kowalski", Country.POLAND, checkin, checkout, false
        );

        // when
        final var result = camperPlaceService.getOccupiedDates(reservation.getCamperPlace().getId(), reservation.getId());

        // then
        assertThat(result).isEmpty();
    }
}