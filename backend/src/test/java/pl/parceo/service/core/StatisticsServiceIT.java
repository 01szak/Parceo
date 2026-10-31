package pl.parceo.service.core;

import pl.parceo.BaseIT;
import pl.parceo.model.constant.Country;
import pl.parceo.model.constant.Operation;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

public class StatisticsServiceIT extends BaseIT {

    @Test
    public void shouldReturnRevenueCorrectly() {
        //Given
        final var dataEntries = 10;
        final var cpPrice = BigDecimal.valueOf(1);
        final var reservationCost = cpPrice; //reservation is one day long

        for (int i = 0; i < dataEntries; i++) {
            createReservationWithNewData(
                    "test_cpt" + i,
                    cpPrice,
                    String.valueOf(i),
                    "GUEST_FN_DEMO" + i,
                    "GUEST_LN_DEMO" + i,
                    Country.PERU,
                    LocalDate.parse("2100-01-01"),
                    LocalDate.parse("2100-01-02"),
                    i <= 4
            );
        }

        //Then
        var revenue = statisticsService.getRevenue();
        assertThat(revenue.size()).isEqualTo(2)
                .withFailMessage("revenue size should contains element with paid and element with unpaid revenue reservations (size 2)");

        var revenueWithPaidReservations = revenue.get(0);
        var revenueWithUnPaidReservations = revenue.get(1);

        validateRevenues(revenueWithPaidReservations, dataEntries);
        validateRevenues(revenueWithUnPaidReservations, dataEntries);
    }

    @Test
    public void shouldReturnCorrectGuestPerCountryDistribution() {
        //Given (2 new guest different country with reservation)
        createReservationWithNewData("TYPE1",
                BigDecimal.valueOf(123),
                "1",
                "GUEST_FN1",
                "GUEST_LN1",
                Country.POLAND,
                LocalDate.parse("2030-01-01"),
                LocalDate.parse("2030-01-05"),
                false
        );
        createReservationWithNewData(
                "TYPE2",
                BigDecimal.valueOf(123),
                "2",
                "GUEST_FN2",
                "GUEST_LN2",
                Country.GERMANY,
                LocalDate.parse("2030-01-01"),
                LocalDate.parse("2030-01-05"),
                false
        );
        assertThat(statisticsService.getGuestPerCountry(01, 2030).size() == 2).isTrue()
                .withFailMessage("country distribution should contains x count equal to distinct countries count");

        createReservation(
                camperPlaceService.findBy(SearchCriteria.builder().key("index").operation(Operation.EQUALS).value("1").build()).stream().findFirst().get(),
                LocalDate.parse("2030-01-06"),
                LocalDate.parse("2030-01-08"),
                guestService.findBy(SearchCriteria.builder().key("firstname").operation(Operation.EQUALS).value("GUEST_FN1").build()).stream().findFirst().get(),
                false
        );
        assertThat(statisticsService.getGuestPerCountry(01, 2030).get(0).usersCount() == 1).isTrue()
                .withFailMessage("if guest contains 2 reservations in given month distribution y's should be equal to number of guests (1)");
        assertThat(statisticsService.getGuestPerCountry(01, 2030).get(1).usersCount() == 1).isTrue();
    }

    private static void validateRevenues(
            List<StatisticsService.StatisticsModel.Revenue> rev,
            int dataEntries
    ) {
        assertThat(rev.size()).isEqualTo(dataEntries)
                .withFailMessage("paid and unpaid reservations are not distinguished correctly");
        for (int i = 0; i < dataEntries; i++) {
            assertThat(rev.get(i).revenue().stripTrailingZeros())
                    .withFailMessage("revenue should be either actual cost or 0")
                    .isIn(BigDecimal.ONE, BigDecimal.ZERO)
                    .withFailMessage("revenue should be either actual cost or 0");
            assertThat(rev.get(i).count())
                    .isIn(1L , 0L)
                    .withFailMessage("reservations count should be either 0 or actual count");
        }
    }

}
