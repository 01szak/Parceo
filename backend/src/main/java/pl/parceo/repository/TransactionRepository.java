package pl.parceo.repository;

import org.springframework.stereotype.Repository;
import pl.parceo.model.entity.Transaction;

@Repository
public interface TransactionRepository extends CRUDRepository<Transaction> {
}
