package pl.parceo.repository;

import pl.parceo.model.entity.DbObject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface CRUDRepository <T extends DbObject>
        extends JpaRepository<T, Integer>, JpaSpecificationExecutor<T> {
 }
