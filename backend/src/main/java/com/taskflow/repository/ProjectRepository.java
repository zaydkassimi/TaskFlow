package com.taskflow.repository;

import com.taskflow.entity.Project;
import com.taskflow.entity.enums.ProjectStatus;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface ProjectRepository extends JpaRepository<Project, Long>, JpaSpecificationExecutor<Project> {

    Page<Project> findByMembersId(Long userId, Pageable pageable);

    Page<Project> findByCreatedById(Long userId, Pageable pageable);

    Page<Project> findByMembersIdAndStatus(Long userId, ProjectStatus status, Pageable pageable);

    Optional<Project> findByIdAndMembersId(Long id, Long userId);

    boolean existsByIdAndMembersId(Long id, Long userId);

    @EntityGraph(attributePaths = {"createdBy", "members"})
    Optional<Project> findWithMembersById(Long id);

    long countByCreatedById(Long userId);

    long countByMembersId(Long userId);

    long countByMembersIdAndStatus(Long userId, ProjectStatus status);

    long countByCreatedByIdAndStatus(Long userId, ProjectStatus status);

    long countByStatus(ProjectStatus status);
}
