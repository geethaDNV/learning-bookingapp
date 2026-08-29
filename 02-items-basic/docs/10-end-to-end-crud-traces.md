# 10 - End To End CRUD Traces

Use this page when you want to see the whole flow without jumping around.

## List items

```text
ItemListPage
  useItemsList
  dispatch(fetchItems(query))
  itemThunks.ts
  itemService.getItemList(query)
  apiClient.get('/items')
  GET /api/v1/items
  routes/items.ts
  ItemsController.getItems
  listItemsQuerySchema
  ItemService.search
  ItemRepository.findPaged + count
  Prisma item.findMany + item.count
```

## Create item

```text
ItemCreatePage
  ItemForm
  dispatch(createItem(payload))
  itemService.create(payload)
  POST /api/v1/items
  ItemsController.createItem
  createItemBodySchema
  ItemService.create
  duplicate name/SKU checks
  ItemRepository.create
  Prisma item.create
  navigate to /items/:id
```

## Edit item

```text
ItemEditPage
  dispatch(fetchItemById(id))
  prefill ItemForm
  dispatch(updateItem({ id, payload }))
  itemService.update(id, payload)
  PUT /api/v1/items/:id
  ItemsController.updateItem
  updateItemBodySchema
  ItemService.update
  duplicate checks excluding current item
  ItemRepository.update
  Prisma item.update
  navigate to /items/:id
```

## Inactivate or reactivate item

```text
ItemTable action
  ConfirmDialog
  dispatch(setItemStatus({ id, isActive }))
  itemService.setStatus(id, isActive)
  PATCH /api/v1/items/:id/status
  ItemsController.updateItemStatus
  updateItemStatusBodySchema
  ItemService.setStatus
  ItemRepository.setStatus
  Prisma item.update
  list row updates
```

## Delete demo data

```text
ItemTable action
  ConfirmDialog
  dispatch(deleteItem(id))
  itemService.delete(id)
  DELETE /api/v1/items/:id
  ItemsController.deleteItem
  ItemService.delete
  ItemRepository.delete
  Prisma item.delete
  list row is removed
```

Continue to [11-how-this-maps-to-the-real-app.md](./11-how-this-maps-to-the-real-app.md).
