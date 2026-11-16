package pl.parceo.repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.data.repository.query.Param;
import pl.parceo.model.dto.GuestCountPerCountry;
import pl.parceo.model.dto.OccupancyPerCamperPlaceType;
import pl.parceo.model.dto.RevenuePerCamperPlace;
import pl.parceo.model.dto.RevenuePerDay;
import pl.parceo.model.entity.Reservation;

import java.time.LocalDate;
import java.util.Date;
import java.util.List;

@Repository
public interface StatisticsRepository extends org.springframework.data.repository.Repository<Reservation, Integer> {

    @Query("""
        SELECT COALESCE(SUM(rt.ammount), 0) rev
        FROM ReservationTransaction rt
        WHERE rt.createdAt BETWEEN :from AND :to
        """)
    double getRevenue(@Param("from") Date from, @Param("to") Date to);

    @Query("""
        SELECT new pl.parceo.model.dto.RevenuePerDay(
            CAST(FUNCTION('DATE_FORMAT', rt.createdAt, :pattern) AS String),
            CAST(COALESCE(SUM(rt.ammount), 0) AS double)
        )
        FROM ReservationTransaction rt
        WHERE rt.createdAt BETWEEN :from AND :to
        GROUP BY CAST(FUNCTION('DATE_FORMAT', rt.createdAt, :pattern) AS String)
        """)
    List<RevenuePerDay> getRevenuePerDay(
            @Param("from") Date from, @Param("to") Date to, @Param("pattern") String pattern);

    @Query("""
        SELECT COALESCE(SUM(FUNCTION('DATEDIFF', r.checkout, r.checkin)), 0) nights
        FROM Reservation r
        WHERE r.checkin BETWEEN :from AND :to
        """)
    long getNightsSold(@Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("""
        SELECT COALESCE(
                CAST(SUM(FUNCTION('DATEDIFF', r.checkout, r.checkin)) AS double)
                / ((CAST(FUNCTION('DATEDIFF', :to, :from) AS long) + 1) * (SELECT COUNT(cp) FROM CamperPlace cp))
        , 0.0) overall_occupancy
        FROM Reservation r
        WHERE r.checkin BETWEEN :from AND :to
        """)
    double getOverallOccupancy(@Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("""
        SELECT new pl.parceo.model.dto.OccupancyPerCamperPlaceType(
            cpt.typeName,
            CAST(SUM(FUNCTION('DATEDIFF', r.checkout, r.checkin)) AS double)
                / ((CAST(FUNCTION('DATEDIFF', :to, :from) AS long) + 1) * (SELECT COUNT(cp2) FROM CamperPlace cp2 WHERE cp2.camperPlaceType.id = cpt.id))
        )
        FROM Reservation r
        JOIN r.camperPlace cp
        JOIN cp.camperPlaceType cpt
        WHERE r.checkin BETWEEN :from AND :to
        GROUP BY cpt.id, cpt.typeName
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
