package pl.parceo.repository;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import pl.parceo.BaseIT;
import pl.parceo.model.constant.Country;
import pl.parceo.model.constant.RevenueGranularity;
import pl.parceo.model.dto.GuestCountPerCountry;
import pl.parceo.model.dto.RevenuePerDay;

import java.math.BigDecimal;
import java.sql.Date;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

public class StatisticsRepositoryIT extends BaseIT {

    @Autowired
    private StatisticsRepository statisticsRepository;

    @Test
    public void shouldSumOnlyAmountsFromTransactionsCreatedWithinRange() {
        // Given - one paid reservation (creates a ReservationTransaction) and one unpaid (no transaction)
        final var paidReservation = createReservationWithNewData(
                "REV_PAID_TYPE", BigDecimal.valueOf(42), "1_REV_PAID_CP",
                "Jan", "Kowalski", Country.POLAND,
                LocalDate.parse("2031-01-01"), LocalDate.parse("2031-01-02"), true
        );
        createReservationWithNewData(
                "REV_UNPAID_TYPE", BigDecimal.valueOf(999), "2_REV_UNPAID_CP",
                "Adam", "Nowak", Country.POLAND,
                LocalDate.parse("2031-01-01"), LocalDate.parse("2031-01-02"), false
        );

        final var from = Date.valueOf(LocalDate.now().minusDays(1));
        final var to = Date.valueOf(LocalDate.now().plusDays(1));

        // When
        final var revenue = statisticsRepository.getRevenue(from, to);

        // Then - only the paid reservation's transaction should count, never the reservation's nominal price directly
        assertThat(revenue).isEqualTo(paidReservation.getPrice().doubleValue());
    }

    @Test
    public void shouldSumNightsAcrossReservationsCheckingInWithinRange() {
        // Given - 2 nights + 3 nights inside the range, 4 nights outside of it
        createReservationWithNewData("NIGHTS_TYPE1", BigDecimal.valueOf(10), "1_NIGHTS_CP", "Jan", "Kowalski", Country.POLAND,
                LocalDate.parse("2031-02-01"), LocalDate.parse("2031-02-03"), false);
        createReservationWithNewData("NIGHTS_TYPE2", BigDecimal.valueOf(10), "2_NIGHTS_CP", "Adam", "Nowak", Country.POLAND,
                LocalDate.parse("2031-02-05"), LocalDate.parse("2031-02-08"), false);
        createReservationWithNewData("NIGHTS_TYPE3", BigDecimal.valueOf(10), "3_NIGHTS_CP", "Eva", "Zielinska", Country.POLAND,
                LocalDate.parse("2032-01-01"), LocalDate.parse("2032-01-05"), false);

        // When
        final var nights = statisticsRepository.getNightsSold(LocalDate.parse("2031-02-01"), LocalDate.parse("2031-02-28"));

        // Then
        assertThat(nights).isEqualTo(5L);
    }

    @Test
    public void shouldComputeOverallOccupancyAcrossAllCamperPlaces() {
        // Given - 1 camper place, occupied for 2 nights out of a 5-day window -> occupancy 0.4
        createReservationWithNewData("OCC_TYPE", BigDecimal.valueOf(10), "1_OCC_CP", "Jan", "Kowalski", Country.POLAND,
                LocalDate.parse("2031-03-01"), LocalDate.parse("2031-03-03"), false);

        // When
        final var occupancy = statisticsRepository.getOverallOccupancy(LocalDate.parse("2031-03-01"), LocalDate.parse("2031-03-05"));

        // Then
        assertThat(occupancy).isEqualTo(0.4);
    }

    @Test
    public void shouldComputeOccupancyPerCamperPlaceType() {
        // Given
        createReservationWithNewData("OCCT_TYPE", BigDecimal.valueOf(10), "1_OCCT_CP", "Jan", "Kowalski", Country.POLAND,
                LocalDate.parse("2031-04-01"), LocalDate.parse("2031-04-03"), false);

        // When
        final var result = statisticsRepository.getOccupancyByCamperPlaceType(LocalDate.parse("2031-04-01"), LocalDate.parse("2031-04-05"));

        // Then
        assertThat(result).hasSize(1);
        assertThat(result.get(0).typeName()).isEqualTo("OCCT_TYPE");
        assertThat(result.get(0).occupancy()).isEqualTo(0.4);
    }

    @Test
    public void shouldCountDistinctGuestsPerCountryWithinRange() {
        // Given - one guest per country, both checking in within range
        createReservationWithNewData("GUEST_DIST_TYPE1", BigDecimal.valueOf(10), "1_GUEST_DIST_CP", "Jan", "Kowalski", Country.POLAND,
                LocalDate.parse("2031-05-01"), LocalDate.parse("2031-05-03"), false);
        createReservationWithNewData("GUEST_DIST_TYPE2", BigDecimal.valueOf(10), "2_GUEST_DIST_CP", "Hans", "Muller", Country.GERMANY,
                LocalDate.parse("2031-05-01"), LocalDate.parse("2031-05-03"), false);

        // When
        final var result = statisticsRepository.getGuestPerCountryDistribution(LocalDate.parse("2031-05-01"), LocalDate.parse("2031-05-10"));

        // Then
        assertThat(result).hasSize(2);
        assertThat(result).extracting(GuestCountPerCountry::country)
                .containsExactlyInAnyOrder(Country.POLAND.getIsoCode(), Country.GERMANY.getIsoCode());
        assertThat(result).allSatisfy(r -> assertThat(r.guestCount()).isEqualTo(1L));
    }

    @Test
    public void shouldGroupRevenueIntoASingleBucketPerGranularity() {
        // Given - two paid reservations, so two transactions, both recorded today
        createReservationWithNewData("DAY_TYPE1", BigDecimal.valueOf(30), "1_DAY_CP", "Jan", "Kowalski", Country.POLAND,
                LocalDate.parse("2031-07-01"), LocalDate.parse("2031-07-02"), true);
        createReservationWithNewData("DAY_TYPE2", BigDecimal.valueOf(12), "2_DAY_CP", "Adam", "Nowak", Country.POLAND,
                LocalDate.parse("2031-08-01"), LocalDate.parse("2031-08-02"), true);

        final var today = LocalDate.now();
        final var from = Date.valueOf(today.minusDays(1));
        final var to = Date.valueOf(today.plusDays(1));

        // When
        final var perDay = statisticsRepository.getRevenuePerDay(from, to, RevenueGranularity.DAY.getPattern());
        final var perMonth = statisticsRepository.getRevenuePerDay(from, to, RevenueGranularity.MONTH.getPattern());

        // Then
        assertThat(perDay).hasSize(1);
        assertThat(perDay.getFirst().day()).isEqualTo(today.toString());
        assertThat(perDay.getFirst().revenue()).isEqualTo(42.0);

        assertThat(perMonth).hasSize(1);
        assertThat(perMonth.getFirst().day()).isEqualTo(today.withDayOfMonth(1).toString());
        assertThat(perMonth.getFirst().revenue()).isEqualTo(42.0);
    }

    @Test
    public void shouldSumRevenuePerDayToTheSameTotalAsGetRevenue() {
        // Given
        createReservationWithNewData("SUM_TYPE1", BigDecimal.valueOf(30), "1_SUM_CP", "Jan", "Kowalski", Country.POLAND,
                LocalDate.parse("2031-09-01"), LocalDate.parse("2031-09-02"), true);
        createReservationWithNewData("SUM_TYPE2", BigDecimal.valueOf(12), "2_SUM_CP", "Adam", "Nowak", Country.POLAND,
                LocalDate.parse("2031-09-05"), LocalDate.parse("2031-09-06"), true);

        final var from = Date.valueOf(LocalDate.now().minusDays(1));
        final var to = Date.valueOf(LocalDate.now().plusDays(1));

        // When
        final var total = statisticsRepository.getRevenue(from, to);
        final var buckets = statisticsRepository.getRevenuePerDay(from, to, RevenueGranularity.DAY.getPattern());

        // Then - the two queries only differ by GROUP BY, so the chart has to add up to the tile
        assertThat(buckets.stream().mapToDouble(RevenuePerDay::revenue).sum()).isEqualTo(total);
    }

    @Test
    public void shouldReturnZeroedStatisticsForAPeriodWithoutAnyData() {
        // Given - nothing was created, so every SUM over the period is NULL
        final var from = LocalDate.parse("2033-01-01");
        final var to = LocalDate.parse("2033-01-31");

        // When & Then
        assertThat(statisticsRepository.getRevenue(Date.valueOf(from), Date.valueOf(to))).isEqualTo(0.0);
        assertThat(statisticsRepository.getRevenuePerDay(
                Date.valueOf(from), Date.valueOf(to), RevenueGranularity.DAY.getPattern())).isEmpty();
        assertThat(statisticsRepository.getNightsSold(from, to)).isEqualTo(0L);
        assertThat(statisticsRepository.getOverallOccupancy(from, to)).isEqualTo(0.0);
        assertThat(statisticsRepository.getOccupancyByCamperPlaceType(from, to)).isEmpty();
        assertThat(statisticsRepository.getGuestPerCountryDistribution(from, to)).isEmpty();
        assertThat(statisticsRepository.getRevenuePerCamperPlace(from, to)).isEmpty();
    }

    @Test
    public void shouldComputeRevenueAndNightsSoldPerCamperPlace() {
        // Given - a single paid reservation, 2 nights
        final var paidReservation = createReservationWithNewData("REV_CP_TYPE", BigDecimal.valueOf(20), "1_REV_CP_INDEX", "Jan", "Kowalski", Country.POLAND,
                LocalDate.parse("2031-06-01"), LocalDate.parse("2031-06-03"), true);

        // When
        final var result = statisticsRepository.getRevenuePerCamperPlace(LocalDate.parse("2031-06-01"), LocalDate.parse("2031-06-10"));

        // Then
        assertThat(result).hasSize(1);
        assertThat(result.get(0).camperPlaceIndex()).isEqualTo("1_REV_CP_INDEX");
        assertThat(result.get(0).nightsSold()).isEqualTo(2L);
        assertThat(result.get(0).revenue()).isEqualTo(paidReservation.getPrice().doubleValue());
    }

}
