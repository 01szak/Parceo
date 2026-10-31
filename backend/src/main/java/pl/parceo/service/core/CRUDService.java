package pl.parceo.service.core;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface CRUDService<T> {

    Page<T> findAll(Pageable pageable);

    Page<T> findAll();

    void delete(T t);

    void deleteAll(List<T> t);

    T findById(int id);

    T create(T t);

    T update(T t);

    List<T> update(List<T> t);

    void deleteById(int id);

    Page<T> findBy(Pageable pageable, SearchCriteria...criteria);
}
