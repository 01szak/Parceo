package pl.parceo.service.core;

import pl.parceo.BaseIT;
import pl.parceo.model.constant.Country;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

public class StatisticsServiceIT extends BaseIT {

    @Test
    public void shouldReturnRevenueOnlyFromPaidReservations() {
        // Given
        final var paidReservation = createReservationWithNewData(
                "SVC_REV_PAID_TYPE", BigDecimal.valueOf(42), "1_SVC_REV_PAID_CP",
                "Jan", "Kowalski", Country.PERU,
                LocalDate.parse("2100-01-01"), LocalDate.parse("2100-01-02"), true
        );
        createReservationWithNewData(
                "SVC_REV_UNPAID_TYPE", BigDecimal.valueOf(999), "2_SVC_REV_UNPAID_CP",
                "Adam", "Nowak", Country.PERU,
                LocalDate.parse("2100-01-01"), LocalDate.parse("2100-01-02"), false
        );

        // When - also exercises the LocalDate -> java.util.Date conversion in StatisticsService.getRevenue
        final var revenue = statisticsService.getRevenue(LocalDate.now().minusDays(1), LocalDate.now().plusDays(1));

        // Then - only the paid reservation's transaction should count
        assertThat(revenue).isEqualTo(paidReservation.getPrice().doubleValue());
    }

    @Test
    public void shouldReturnCorrectGuestPerCountryDistribution() {
        // Given (2 new guests, different countries, each with one reservation)
        createReservationWithNewData("TYPE1",
                BigDecimal.valueOf(123), "1", "GUEST_FN1", "GUEST_LN1", Country.POLAND,
                LocalDate.parse("2030-01-01"), LocalDate.parse("2030-01-05"), false
        );
        createReservationWithNewData(
                "TYPE2",
                BigDecimal.valueOf(123), "2", "GUEST_FN2", "GUEST_LN2", Country.GERMANY,
                LocalDate.parse("2030-01-01"), LocalDate.parse("2030-01-05"), false
        );

        // When
        final var distribution = statisticsService.getGuestPerCountryDistribution(
                LocalDate.parse("2030-01-01"), LocalDate.parse("2030-01-31")
        );

        // Then
        assertThat(distribution).hasSize(2);
        assertThat(distribution).allSatisfy(d -> assertThat(d.guestCount()).isEqualTo(1L));
    }

}
