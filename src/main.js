/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
    if (!purchase) return 0;
  const { discount, sale_price, quantity } = purchase;
  
  const discountCoefficient = 1 - discount / 100;

  return sale_price * quantity * discountCoefficient;
  // @TODO: Расчет выручки от операции
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {

    if (!seller || typeof seller.profit !== 'number') {
    return 0;
  }

  const { profit } = seller; // @TODO: Расчет бонуса от позиции в рейтинге

  if (index === 0) {
    return profit * 0.15;
  }

  if (index === 1 || index === 2) {
    return profit * 0.1;
  }

  if (index === total - 1) {
    return 0;
  }

  return profit * 0.05;
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
  // @TODO: Проверка входных данных
  if (!data || typeof data !== 'object') {
    throw new Error('Объект data обязателен и должен быть объектом');
  }

  
  if (!data.sellers || !Array.isArray(data.sellers)) {
    throw new Error('В data должна быть коллекция sellers (массив)');
  }

  if (!data.products || !Array.isArray(data.products)) {
    throw new Error('В data должна быть коллекция products (массив)');
  }

  if (!data.purchase_records || !Array.isArray(data.purchase_records)) {
    throw new Error('В data должна быть коллекция purchase_records (массив)');
  }

  
  if (!options || typeof options !== 'object') {
    throw new Error('Опции (options) должны быть объектом');
  }

  const { calculateRevenue, calculateBonus } = options;

  if (!calculateRevenue || typeof calculateRevenue !== 'function') {
    throw new Error('В options должна быть функция calculateRevenue');
  }

  if (!calculateBonus || typeof calculateBonus !== 'function') {
    throw new Error('В options должна быть функция calculateBonus');
  }

  // @TODO: Проверка наличия опций

  // @TODO: Подготовка промежуточных данных для сбора статистики
  const sellerStats = data.sellers.map((seller) => ({
    id: seller.id,
    name: `${seller.first_name} ${seller.last_name}`,
    revenue: 0,
    profit: 0,
    sales_count: 0,
    products_sold: {},
  }));

  // @TODO: Индексация продавцов и товаров для быстрого доступа
  const sellerIndex = {};
  for (const stat of sellerStats) {
    sellerIndex[stat.id] = stat;
  }

  const productIndex = {};
  for (const product of data.products) {
    productIndex[product.sku] = product;
  }

  // @TODO: Расчет выручки и прибыли для каждого продавца
  data.purchase_records.forEach((record) => {
    // Чек
    const seller = sellerIndex[record.seller_id]; // Продавец
    if (!seller) return;

    // Увеличить количество продаж
    seller.sales_count += 1;

    let checkTotalRevenue = 0;

    // Увеличить общую сумму выручки всех продаж

    // Расчёт прибыли для каждого товара
    record.items.forEach((item) => {
      const product = productIndex[item.sku]; // Товар
      
      // Посчитать себестоимость (cost) товара как product.purchase_price, умноженную на количество товаров из чека
      const cost = product.purchase_price * item.quantity;

      // Посчитать выручку (revenue) с учётом скидки через функцию calculateRevenue
      const revenue = calculateRevenue(item, product);
      checkTotalRevenue += revenue;

      // Посчитать прибыль: выручка минус себестоимость
      const profitFromItem = revenue - cost;

      // Увеличить общую накопленную прибыль (profit) у продавца
      seller.profit += profitFromItem;

      // Учёт количества проданных товаров
      if (!seller.products_sold[item.sku]) {
        seller.products_sold[item.sku] = 0;
      }
      // По артикулу товара увеличить его проданное количество у продавца
      seller.products_sold[item.sku] += item.quantity;
    });
    seller.revenue += checkTotalRevenue;
  });

  // @TODO: Сортировка продавцов по прибыли
  sellerStats.sort((a, b) => b.profit - a.profit);

  // @TODO: Назначение премий на основе ранжирования
  const totalSellers = sellerStats.length;

  sellerStats.forEach((seller, index) => {

    seller.bonus = calculateBonusByProfit(index, totalSellers, seller);

    seller.top_products = Object.entries(seller.products_sold)
      .map(([sku, quantity]) => ({ sku, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);
  });

  // @TODO: Подготовка итоговой коллекции с нужными полями
  return sellerStats.map((seller) => ({
    seller_id: seller.id,
    name: seller.name,
    revenue: +seller.revenue.toFixed(2),
    profit: +seller.profit.toFixed(2),
    sales_count: seller.sales_count,
    top_products: seller.top_products,
    bonus: +seller.bonus.toFixed(2),
  }));
}
