package pl.parceo.repository;

import pl.parceo.model.entity.CamperPlace;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface CamperPlaceRepository extends CRUDRepository<CamperPlace> {

    @Query("""
        select c from CamperPlace c order by cast(c.index as integer ), c.index
    """)
    List<CamperPlace> findAllOrderByIndex();

    @Query("""
        select max(cast(c.index as integer)) i from CamperPlace c
    """)
    String getCamperplaceMaxIndex();

    List<CamperPlace> findCamperPlaceByPriceNotNullAndCamperPlaceType_Id(Integer cptId);

    interface OccupiedDateRow {
        Integer getReservationId();
        LocalDate getOcpDate();
    }

    @Query(value = """
        WITH RECURSIVE
        ocp AS (
            SELECT r.id AS ocp_r_id, r.checkin AS ocp_date, r.checkout AS ocp_checkout
            FROM reservation AS r
            WHERE r.camper_place_id = :cpId
              AND r.checkout >= CURDATE()
              AND (:reservationId IS NULL OR r.id <> :reservationId)
                
            UNION ALL
                
            SELECT ocp_r_id, DATE_ADD(ocp_date, INTERVAL 1 DAY), ocp_checkout
            FROM ocp
            WHERE DATE_ADD(ocp_date, INTERVAL 1 DAY) < ocp_checkout
        )
            
        SELECT ocp_r_id AS reservationId, ocp_date AS ocpDate
        FROM ocp
        WHERE ocp_date >= CURDATE()
        ORDER BY ocp_r_id, ocp_date
    """, nativeQuery = true)
    List<OccupiedDateRow> getOccupiedDates(@Param("cpId") Integer cpId, @Param("reservationId") Integer reservationId);

    @Query(value = """
        SELECT COUNT(*) FROM reservation r
        WHERE r.camper_place_id = :cpId
          AND (:reservationId IS NULL OR r.id <> :reservationId)
          AND r.checkin  < :checkout
          AND r.checkout > :checkin
    """, nativeQuery = true)
    long countOverlappingReservations(
            @Param("cpId") Integer cpId,
            @Param("checkin") LocalDate checkin,
            @Param("checkout") LocalDate checkout,
            @Param("reservationId") Integer reservationId
    );

    @Query(value = """
        SELECT *
        FROM camper_place cp
        WHERE (
            SELECT COUNT(*)
            FROM reservation r
            WHERE r.camper_place_id = cp.id
              AND r.checkin < :to
              AND r.checkout > :from
        ) = 0;
    """, nativeQuery = true)
    List<CamperPlace> getAvailableCamperPlaces(@Param("from") LocalDate from, @Param("to") LocalDate to);


}
