package pl.parceo.controller;

import pl.parceo.model.dto.GuestCountPerCountry;
import pl.parceo.model.dto.OccupancyPerCamperPlaceType;
import pl.parceo.model.dto.RevenuePerCamperPlace;
import pl.parceo.service.core.StatisticsService;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.text.ParseException;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/statistics")
@AllArgsConstructor
public class StatisticsController {

    private final StatisticsService statisticsService;

    @GetMapping("/revenue/{from}/{to}")
    public double getRevenue(@PathVariable LocalDate from, @PathVariable LocalDate to) throws ParseException {
        return statisticsService.getRevenue(from, to);
    }

    @GetMapping("/nights-sold/{from}/{to}")
    public long getNightsSold(@PathVariable LocalDate from, @PathVariable LocalDate to) {
        return statisticsService.getNightsSold(from, to);
    }

    @GetMapping("/overall-occupancy/{from}/{to}")
    public double getOverallOccupancy(@PathVariable LocalDate from, @PathVariable LocalDate to) {
        return statisticsService.getOverallOccupancy(from, to);
    }

    @GetMapping("/occupancy-by-camper-place-type/{from}/{to}")
    public List<OccupancyPerCamperPlaceType> getOccupancyByCamperPlaceType(@PathVariable LocalDate from, @PathVariable LocalDate to) {
        return statisticsService.getOccupancyByCamperPlaceType(from, to);
    }

    @GetMapping("/guest-per-country-distribution/{from}/{to}")
    public List<GuestCountPerCountry> getGuestPerCountryDistribution(@PathVariable LocalDate from, @PathVariable LocalDate to) {
        return statisticsService.getGuestPerCountryDistribution(from, to);
    }

    @GetMapping("/revenue-per-camper-place/{from}/{to}")
    public List<RevenuePerCamperPlace> getRevenuePerCamperPlace(@PathVariable LocalDate from, @PathVariable LocalDate to) {
        return statisticsService.getRevenuePerCamperPlace(from, to);
    }

}
