package pl.parceo.controller;

import pl.parceo.service.core.StatisticsService;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/statistics")
@AllArgsConstructor
public class StatisticsController {

    private final StatisticsService statisticsService;

    @GetMapping("/revenue/{month}/{year}")
    public List<List<StatisticsService.StatisticsModel.Revenue>> getRevenue(@PathVariable int month, @PathVariable int year) {
        return statisticsService.getRevenue(month, year);
    }

    @GetMapping("/countryDistribution/{month}/{year}")
    public List<StatisticsService.StatisticsModel.CountryDistribution> getUserPerCountry(@PathVariable int month, @PathVariable int year) {
        return statisticsService.getGuestPerCountry(month, year);
    }
}
