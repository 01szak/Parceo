package pl.parceo.service.core;

import pl.parceo.model.constant.JoinOperator;
import pl.parceo.model.entity.DbObject;
import pl.parceo.repository.CRUDRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;


@Service
@Transactional
public abstract class CRUDServiceImpl<T extends DbObject> implements CRUDService<T> {

    private static final Sort UPDATED_AT_DESC = Sort.by(
            Sort.Direction.DESC,"updatedAt"
    );

     private class SpecificationBuilder {

        public Specification<T> build(SearchCriteria...criteria) {
            if (criteria == null || criteria.length == 0) {
                return Specification.where((Specification<T>) null);
            }

            var spec = Specification.where(new GenericSpecification<T>(criteria[0]));

            for (int i = 1; i < criteria.length; i++) {
                if (JoinOperator.OR.equals(criteria[i].joinOperator())) {
                    spec = spec.or(new GenericSpecification<>(criteria[i]));
                } else {
                    spec = spec.and(new GenericSpecification<>(criteria[i]));
                }
            }

            return spec;
        }
    }

    @Override
    public Page<T> findBy(Pageable pageable, SearchCriteria ...searchCriteria) {
        if (pageable == null) {
            pageable = Pageable.unpaged(UPDATED_AT_DESC);
        }

        if (pageable.getSort().isEmpty()) {
            pageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), UPDATED_AT_DESC);
        }

        if (
                searchCriteria == null
                || searchCriteria.length == 0
                || Arrays.stream(searchCriteria).filter(sc -> sc.key().isEmpty()).count() > 0
        ) {
            return findAll(pageable);
        }

        var specification = buildSpecification(searchCriteria);
        return getRepository().findAll(specification, pageable);
    }

    private Specification<T> buildSpecification(SearchCriteria[] searchCriteria) {
        return new SpecificationBuilder().build(searchCriteria);
    }

    public Page<T> findBy(SearchCriteria ...searchCriteria) {
        return findBy(null, searchCriteria);
    }

    @Override
    public T create(T t){
        return getRepository().save(t);
    }

    @Override
    public Page<T> findAll(Pageable pageable){
        var sort = pageable.getSort();

        if (sort.isEmpty()) {
            pageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), UPDATED_AT_DESC);
        }
        return getRepository().findAll(pageable);
    }

    @Override
    @EntityGraph
    public Page<T> findAll(){
        return findAll(Pageable.unpaged(UPDATED_AT_DESC));
    }

    @Override
    public T findById(int id){
        return getRepository().findById(id).orElseThrow();
    }

    @Override
    public T update(T t){
        return getRepository().save(t);
    }

    @Override
    public List<T> update(List<T> t){
        return getRepository().saveAll(t);
    }

    @Override
    public void deleteById(int id){
        getRepository().deleteById(id);
    }

    @Override
    public void delete(T t){
        getRepository().delete(t);
    }

    @Override
    public void deleteAll(List<T> t){
        getRepository().deleteAll(t);
    }

    protected abstract CRUDRepository<T> getRepository();

}
