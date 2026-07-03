package com.example.cafeposbackend.floor;

import com.example.cafeposbackend.common.enums.OrderStatus;
import com.example.cafeposbackend.common.exception.BusinessRuleException;
import com.example.cafeposbackend.common.exception.ResourceNotFoundException;
import com.example.cafeposbackend.common.util.CurrentUser;
import com.example.cafeposbackend.floor.FloorDtos.*;
import com.example.cafeposbackend.order.Order;
import com.example.cafeposbackend.order.OrderRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class FloorServiceImpl implements FloorService {
  private final FloorRepository floorRepository;
  private final RestaurantTableRepository tableRepository;
  private final OrderRepository orderRepository;
  private final CurrentUser currentUser;

  public FloorServiceImpl(
      FloorRepository floorRepository,
      RestaurantTableRepository tableRepository,
      OrderRepository orderRepository,
      CurrentUser currentUser) {
    this.floorRepository = floorRepository;
    this.tableRepository = tableRepository;
    this.orderRepository = orderRepository;
    this.currentUser = currentUser;
  }

  @Override
  public FloorResponse create(FloorRequest request) {
    Floor floor = new Floor();
    floor.setName(request.name().trim());
    return map(floorRepository.save(floor));
  }

  @Override
  @Transactional(readOnly = true)
  public List<FloorResponse> getAll() {
    return floorRepository.findAll().stream().map(this::map).toList();
  }

  @Override
  public FloorResponse update(Long id, FloorRequest request) {
    Floor floor = findFloor(id);
    floor.setName(request.name().trim());
    return map(floorRepository.save(floor));
  }

  @Override
  public void delete(Long id) {
    Floor floor = findFloor(id);
    if (tableRepository.existsByFloorId(id)) {
      throw new BusinessRuleException("Delete all tables on this floor before deleting the floor");
    }
    floorRepository.delete(floor);
  }

  @Override
  public TableResponse createTable(Long floorId, TableRequest request) {
    RestaurantTable table = new RestaurantTable();
    table.setFloor(findFloor(floorId));
    apply(table, request);
    return map(tableRepository.save(table));
  }

  @Override
  public List<TableResponse> getTables(Long floorId) {
    findFloor(floorId);
    return tableRepository.findByFloorId(floorId).stream().map(this::map).toList();
  }

  @Override
  public TableResponse updateTable(Long id, TableRequest request) {
    RestaurantTable table = findTable(id);
    apply(table, request);
    return map(tableRepository.save(table));
  }

  @Override
  public void deleteTable(Long id) {
    tableRepository.delete(findTable(id));
  }

  @Override
  public TableStatusResponse getTableStatus(Long id) {
    RestaurantTable table = findTable(id);
    Order active =
        orderRepository.findAll().stream()
            .filter(order -> order.getTable() != null && order.getTable().getId().equals(id))
            .filter(order -> order.getStatus() == OrderStatus.DRAFT)
            .findFirst()
            .orElse(null);
    return new TableStatusResponse(
        id,
        table.getOccupiedBy() != null,
        table.getOccupiedBy() == null ? null : table.getOccupiedBy().getId(),
        table.getOccupiedBy() == null ? null : table.getOccupiedBy().getName(),
        active == null ? null : active.getId());
  }

  @Override
  public TableResponse claimTable(Long id) {
    RestaurantTable table =
        tableRepository
            .findByIdForUpdate(id)
            .filter(RestaurantTable::isActive)
            .orElseThrow(() -> new ResourceNotFoundException("Active table", id));
    var user = currentUser.require();
    if (table.getOccupiedBy() != null && !table.getOccupiedBy().getId().equals(user.getId())) {
      throw new BusinessRuleException(
          "Table "
              + table.getTableNumber()
              + " is currently served by "
              + table.getOccupiedBy().getName());
    }
    table.setOccupiedBy(user);
    return map(tableRepository.save(table));
  }

  @Override
  public TableResponse releaseTable(Long id) {
    RestaurantTable table =
        tableRepository
            .findByIdForUpdate(id)
            .orElseThrow(() -> new ResourceNotFoundException("Table", id));
    var user = currentUser.require();
    if (table.getOccupiedBy() == null) {
      return map(table);
    }
    if (!table.getOccupiedBy().getId().equals(user.getId())) {
      throw new BusinessRuleException(
          "Only " + table.getOccupiedBy().getName() + " can mark this table free");
    }
    boolean hasDraft =
        orderRepository.findAll().stream()
            .anyMatch(
                order ->
                    order.getTable() != null
                        && order.getTable().getId().equals(id)
                        && order.getStatus() == OrderStatus.DRAFT);
    if (hasDraft) {
      throw new BusinessRuleException("Complete or cancel the draft order before freeing the table");
    }
    table.setOccupiedBy(null);
    return map(tableRepository.save(table));
  }

  private void apply(RestaurantTable table, TableRequest request) {
    table.setTableNumber(request.tableNumber().trim());
    table.setSeats(request.seats());
    table.setActive(request.active() == null || request.active());
  }

  private Floor findFloor(Long id) {
    return floorRepository
        .findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Floor", id));
  }

  private RestaurantTable findTable(Long id) {
    return tableRepository
        .findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Table", id));
  }

  private FloorResponse map(Floor floor) {
    return new FloorResponse(floor.getId(), floor.getName(), getTables(floor.getId()));
  }

  private TableResponse map(RestaurantTable table) {
    return new TableResponse(
        table.getId(),
        table.getFloor().getId(),
        table.getTableNumber(),
        table.getSeats(),
        table.isActive(),
        table.getOccupiedBy() == null ? null : table.getOccupiedBy().getId(),
        table.getOccupiedBy() == null ? null : table.getOccupiedBy().getName());
  }
}
