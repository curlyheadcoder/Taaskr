package com.taaskr.repository;

import com.taaskr.entity.PartnerDiscussion;
import com.taaskr.enums.DiscussionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PartnerDiscussionRepository extends JpaRepository<PartnerDiscussion, Long> {

    List<PartnerDiscussion> findByProviderIdOrderByUpdatedAtDesc(Long providerId);

    List<PartnerDiscussion> findAllByOrderByUpdatedAtDesc();

    List<PartnerDiscussion> findByStatusOrderByUpdatedAtDesc(DiscussionStatus status);
}
