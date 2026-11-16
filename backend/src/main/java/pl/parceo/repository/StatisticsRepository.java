package pl.parceo.repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;
import pl.parceo.model.dto.GuestCountPerCountry;
import pl.parceo.model.dto.OccupancyPerCamperPlaceType;
import pl.parceo.model.dto.RevenuePerCamperPlace;
import pl.parceo.model.entity.Reservation;

import java.time.LocalDate;
import java.util.Date;
import java.util.List;

public interface StatisticsRepository extends Repository<Reservation, Integer> {

    @Query("""
        SELECT SUM(rt.ammount) rev
        FROM ReservationTransaction rt
        WHERE rt.createdAt BETWEEN :from AND :to
        """)
    double getRevenue(@Param("from") Date from, @Param("to") Date to);

    @Query("""
        SELECT SUM(FUNCTION('DATEDIFF', r.checkout, r.checkin)) nights
        FROM Reservation r
        WHERE r.checkin BETWEEN :from AND :to
        """)
    long getNightsSold(@Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("""
        SELECT
                SUM(FUNCTION('DATEDIFF', r.checkin, r.checkout))
                / (CAST(FUNCTION('DATEDIFF', :from, :to) AS long) * CAST((SELECT COUNT(cp) FROM CamperPlace cp) AS long)) overall_occupancy
        FROM Reservation r
        WHERE r.checkin BETWEEN :from AND :to
        """)
    double getOverallOccupancy(@Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("""
        SELECT new pl.parceo.model.dto.OccupancyPerCamperPlaceType(cpt.typeName typeName, (COUNT(r) / (SELECT COUNT(r2) FROM Reservation r2 WHERE r2.checkin BETWEEN :from AND :to)) occupancy)
        FROM Reservation r
        JOIN r.camperPlace cp
        JOIN cp.camperPlaceType cpt
        WHERE r.checkin BETWEEN :from AND :to
        GROUP BY cpt.id
        """)
    List<OccupancyPerCamperPlaceType> getOccupancyByCamperPlaceType(@Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("""
        SELECT new pl.parceo.model.dto.GuestCountPerCountry(g.country country, COUNT(DISTINCT g))
        FROM Guest g
        JOIN g.reservations r
        WHERE r.checkin BETWEEN :from AND :to
        GROUP BY g.country
        """)
    List<GuestCountPerCountry> getGuestPerCountryDistribution(@Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("""
        SELECT new pl.parceo.model.dto.RevenuePerCamperPlace(
            r.camperPlace.index,
            CAST(SUM(FUNCTION('DATEDIFF', r.checkout, r.checkin)) AS long),
            CAST(SUM(rt.ammount) AS double)
        )
        FROM ReservationTransaction rt
        JOIN rt.reservation r
        WHERE r.checkin BETWEEN :from AND :to AND r.paid = TRUE
        GROUP BY r.camperPlace.index
        """)
    List<RevenuePerCamperPlace> getRevenuePerCamperPlace(@Param("from") LocalDate from, @Param("to") LocalDate to);

}
