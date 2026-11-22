package pl.parceo.repository;

import pl.parceo.model.entity.Guest;
import org.springframework.stereotype.Repository;

@Repository
public interface GuestRepository extends CRUDRepository<Guest> {
}
