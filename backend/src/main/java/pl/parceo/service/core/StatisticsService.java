package pl.parceo.service.core;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pl.parceo.model.constant.RevenueGranularity;
import pl.parceo.model.dto.GuestCountPerCountry;
import pl.parceo.model.dto.OccupancyPerCamperPlaceType;
import pl.parceo.model.dto.RevenuePerCamperPlace;
import pl.parceo.model.dto.RevenuePerDay;
import pl.parceo.repository.StatisticsRepository;

import java.sql.Date;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class StatisticsService {

    private final StatisticsRepository statisticsRepository;

    public double getRevenue(LocalDate from, LocalDate to) {
        return statisticsRepository.getRevenue(Date.valueOf(from), Date.valueOf(to));
    }

    public List<RevenuePerDay> getRevenuePerDay(LocalDate from, LocalDate to, RevenueGranularity granularity) {
        return statisticsRepository.getRevenuePerDay(Date.valueOf(from), Date.valueOf(to), granularity.getPattern());
    }

    public long getNightsSold(LocalDate from, LocalDate to) {
        return statisticsRepository.getNightsSold(from, to);
    }

    public double getOverallOccupancy(LocalDate from, LocalDate to) {
        return statisticsRepository.getOverallOccupancy(from, to);
    }

    public List<OccupancyPerCamperPlaceType> getOccupancyByCamperPlaceType(LocalDate from, LocalDate to) {
        return statisticsRepository.getOccupancyByCamperPlaceType(from, to);
    }

    public List<GuestCountPerCountry> getGuestPerCountryDistribution(LocalDate from, LocalDate to) {
        return statisticsRepository.getGuestPerCountryDistribution(from, to);
    }

    public List<RevenuePerCamperPlace> getRevenuePerCamperPlace(LocalDate from, LocalDate to) {
        return statisticsRepository.getRevenuePerCamperPlace(from, to);
    }
}
