package pl.parceo.repository;

import pl.parceo.model.constant.ReservationStatus;
import pl.parceo.model.entity.Reservation;
import pl.parceo.service.core.StatisticsService.StatisticsModel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ReservationRepository extends CRUDRepository<Reservation> {

        List<Reservation> findByReservationStatusNot(ReservationStatus status);

        Page<Reservation> findAllByCamperPlace_Index(Pageable pageable, String index);

        @Query("""
            SELECT r FROM Reservation r WHERE CONCAT(r.guest.firstname, ' ', r.guest.lastname) LIKE %:fullName%
       """)
        Page<Reservation> findAllByUserFullName(Pageable pageable ,@Param("fullName") String fullName);

        @Query("""
            SELECT r FROM Reservation r WHERE r.camperPlace.id = :camperPlaceId AND r.paid = true
        """)
        List<Reservation> findByCamperPlace_IdIfPaid(@Param("camperPlaceId") int camperPlaceId);

        @Query("""
            SELECT r FROM Reservation r WHERE FUNCTION('MONTH', r.checkin) = :month AND FUNCTION('YEAR', r.checkin) = :year AND r.camperPlace.id = :camperPlaceId AND r.paid = true
        """)
        List<Reservation> findAllByMonthYearAndCamperPlaceIdIfPaid(
                @Param("month") int month, @Param("year") int year, @Param("camperPlaceId") int camperPlaceId);

        @Query("""
            SELECT r FROM Reservation r WHERE FUNCTION('YEAR', r.checkin) = :year AND r.camperPlace.id = :camperPlaceId AND r.paid = true
        """)
        List<Reservation> findAllByYearAndCamperPlaceIdIfPaid(
                @Param("year") int year, @Param("camperPlaceId") int camperPlaceId);

        @Query("""
            SELECT r FROM Reservation r WHERE r.camperPlace.id = :camperPlaceId AND r.reservationStatus != 'COMING'
        """)
        List<Reservation> findAllByCamperPlaceIdIfStatusNotComing(@Param("camperPlaceId") int camperPlaceId);

        @Query("""
            SELECT r FROM Reservation r WHERE FUNCTION('YEAR', r.checkin) = :year AND r.camperPlace.id = :camperPlaceId AND r.reservationStatus != 'COMING'
        """)
        List<Reservation> findAllByYearAndCamperPlace_IdIfStatusNotComing(@Param("year") int year, @Param("camperPlaceId") int camperPlaceId);

        @Query("""
            SELECT r FROM Reservation r WHERE FUNCTION('YEAR', r.checkin) = :year AND FUNCTION('MONTH', r.checkin) = :month AND r.camperPlace.id = :camperPlaceId AND r.reservationStatus != 'COMING'
        """)
        List<Reservation> findAllByMonthYearAndCamperPlace_IdIfStatusNotComing(@Param("month") int month, @Param("year") int year, @Param("camperPlaceId") int camperPlaceId);

        @Query("""
            SELECT new pl.parceo.service.core.StatisticsService$StatisticsModel$Revenue(
                cp.index, 
                count(r),
                COALESCE(SUM(r.price), 0)
            ) 
            FROM CamperPlace cp 
            LEFT JOIN cp.reservations r ON r.paid = :isPaid 
            AND (:month = 0 OR FUNCTION('MONTH', r.checkin) = :month) 
            AND (:year = 0 OR FUNCTION('YEAR', r.checkin) = :year)
            GROUP BY cp.index
        """)
        List<StatisticsModel.Revenue> countRevenueOfAllCamperPlaces(@Param("isPaid") boolean isPaid, @Param("month") int month, @Param("year") int year);

        @Query("""
            SELECT r FROM Reservation r
            WHERE :date BETWEEN r.checkin AND r.checkout
            AND r.camperPlace.id = :camperPlaceId
        """)
        List<Reservation> findByDateInBetweenAndCamperPlaceId(@Param("date") LocalDate date, @Param("camperPlaceId") Integer camperPlaceId);


        @Modifying
        @Query("""
            UPDATE Reservation r SET r.reservationStatus = 
            CASE 
                WHEN r.checkin <= CURRENT_DATE AND r.checkout > CURRENT_DATE THEN 'ACTIVE'
                WHEN r.checkout <= CURRENT_DATE THEN 'EXPIRED'
                WHEN r.checkin > CURRENT_DATE THEN 'COMING'
                ELSE r.reservationStatus 
            END
            WHERE r.reservationStatus NOT IN ('UNVERIFIED', 'EXPIRED')
                    AND (
                        (r.checkin <= CURRENT_DATE AND r.checkout > CURRENT_DATE AND r.reservationStatus <> 'ACTIVE')
                        OR (r.checkout <= CURRENT_DATE AND r.reservationStatus <> 'EXPIRED')
                        OR (r.checkin > CURRENT_DATE AND r.reservationStatus <> 'COMING')
                    )
        """)
        int setActualReservationStatuses();

}
