package com.taskflow.repository;

import com.taskflow.entity.Task;
import com.taskflow.entity.enums.TaskPriority;
import com.taskflow.entity.enums.TaskStatus;
import java.time.LocalDate;
import java.util.Collection;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.lang.Nullable;

public interface TaskRepository extends JpaRepository<Task, Long>, JpaSpecificationExecutor<Task> {

    @Override
    @EntityGraph(attributePaths = {"project", "assignedTo", "createdBy"})
    Page<Task> findAll(@Nullable Specification<Task> spec, Pageable pageable);

    @EntityGraph(attributePaths = {"project", "assignedTo", "createdBy"})
    Optional<Task> findWithDetailsById(Long id);

    @EntityGraph(attributePaths = {"project", "assignedTo", "createdBy"})
    Page<Task> findByProjectId(Long projectId, Pageable pageable);

    @EntityGraph(attributePaths = {"project", "assignedTo", "createdBy"})
    @Query("SELECT t FROM Task t WHERE t.assignedTo.id = :userId")
    Page<Task> findByAssignedToId(@Param("userId") Long userId, Pageable pageable);

    long countByProjectId(Long projectId);

    long countByProjectIdAndStatus(Long projectId, TaskStatus status);

    long countByProjectIdAndPriority(Long projectId, TaskPriority priority);

    @Query("""
            SELECT COUNT(t) FROM Task t
            WHERE t.project.id IN :projectIds
              AND t.dueDate IS NOT NULL
              AND t.dueDate < :today
              AND t.status <> com.taskflow.entity.enums.TaskStatus.DONE
            """)
    long countOverdueByProjectIds(@Param("projectIds") Collection<Long> projectIds, @Param("today") LocalDate today);

    @Query("SELECT COUNT(t) FROM Task t WHERE t.assignedTo.id = :userId")
    long countByAssignedToId(@Param("userId") Long userId);

    @Query("""
            SELECT COUNT(t) FROM Task t
            WHERE t.assignedTo.id = :userId
              AND t.dueDate IS NOT NULL
              AND t.dueDate < :today
              AND t.status <> com.taskflow.entity.enums.TaskStatus.DONE
            """)
    long countOverdueByAssignedToId(@Param("userId") Long userId, @Param("today") LocalDate today);

    long countByProjectIdInAndStatus(Collection<Long> projectIds, TaskStatus status);

    long countByAssignedToIdAndStatus(Long userId, TaskStatus status);
}
