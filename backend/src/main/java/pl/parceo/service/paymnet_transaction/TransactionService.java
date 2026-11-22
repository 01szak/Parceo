package pl.parceo.service.paymnet_transaction;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pl.parceo.model.entity.Transaction;
import pl.parceo.repository.CRUDRepository;
import pl.parceo.repository.TransactionRepository;
import pl.parceo.service.core.CRUDServiceImpl;

@Service
@RequiredArgsConstructor
public class TransactionService extends CRUDServiceImpl<Transaction> {

    private final TransactionRepository transactionRepository;

    @Override
    protected CRUDRepository<Transaction> getRepository() {
        return transactionRepository;
    }
}
