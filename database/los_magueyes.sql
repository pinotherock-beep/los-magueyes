CREATE DATABASE IF NOT EXISTS los_magueyes CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE los_magueyes;

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'employee') NOT NULL DEFAULT 'employee',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL UNIQUE,
  slug VARCHAR(80) NOT NULL UNIQUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id INT UNSIGNED NOT NULL,
  name VARCHAR(120) NOT NULL,
  description VARCHAR(500) NULL,
  price DECIMAL(10,2) NOT NULL,
  available BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id),
  UNIQUE KEY uq_products_category_name (category_id, name),
  INDEX idx_products_category_available (category_id, available)
);

-- Actualiza de forma segura una base creada con una versión anterior del proyecto.
SET @product_unique_exists = (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'products'
    AND index_name = 'uq_products_category_name'
);
SET @product_unique_sql = IF(
  @product_unique_exists = 0,
  'ALTER TABLE products ADD UNIQUE KEY uq_products_category_name (category_id, name)',
  'SELECT 1'
);
PREPARE product_unique_statement FROM @product_unique_sql;
EXECUTE product_unique_statement;
DEALLOCATE PREPARE product_unique_statement;

CREATE TABLE IF NOT EXISTS orders (
  -- El id autoincremental es el folio consecutivo y define el turno de llegada.
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  customer_name VARCHAR(100) NOT NULL,
  address VARCHAR(250) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  order_type ENUM('local', 'llevar') NOT NULL DEFAULT 'llevar',
  notes VARCHAR(300) NULL,
  status ENUM('pendiente', 'preparando', 'listo', 'entregado', 'cancelado') NOT NULL DEFAULT 'pendiente',
  total DECIMAL(10,2) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_orders_status_date (status, created_at, id)
);

-- Agrega la dirección sin borrar los pedidos de instalaciones anteriores.
SET @order_address_exists = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'orders'
    AND column_name = 'address'
);
SET @order_address_sql = IF(
  @order_address_exists = 0,
  'ALTER TABLE orders ADD COLUMN address VARCHAR(250) NULL AFTER customer_name',
  'SELECT 1'
);
PREPARE order_address_statement FROM @order_address_sql;
EXECUTE order_address_statement;
DEALLOCATE PREPARE order_address_statement;

CREATE TABLE IF NOT EXISTS order_items (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id INT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  quantity INT UNSIGNED NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_items_product FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS sessions (
  session_id VARCHAR(128) NOT NULL PRIMARY KEY,
  expires BIGINT UNSIGNED NOT NULL,
  data MEDIUMTEXT NOT NULL,
  INDEX idx_sessions_expires (expires)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO categories (name, slug, sort_order) VALUES
('Tacos', 'tacos', 1),
('Consomés', 'consomes', 2),
('Barbacoa por kilos', 'barbacoa-kilos', 3),
('Especialidades', 'especialidades', 4),
('Bebidas', 'bebidas', 5),
('Extras y postre', 'extras-postre', 6);

INSERT IGNORE INTO products (category_id, name, description, price) VALUES
((SELECT id FROM categories WHERE slug='tacos'), 'Taco surtido', 'Barbacoa surtida de borrego.', 32),
((SELECT id FROM categories WHERE slug='tacos'), 'Taco de longaniza', 'Longaniza elaborada a base de carne de borrego.', 32),
((SELECT id FROM categories WHERE slug='tacos'), 'Taco de pancita o montalayo', 'Pancita de borrego con sazón tradicional.', 32),
((SELECT id FROM categories WHERE slug='tacos'), 'Taco de tripa', 'Tripa de borrego preparada al estilo de la casa.', 32),
((SELECT id FROM categories WHERE slug='tacos'), 'Taco de carne asada', 'Carne y costilla asada de borrego.', 36),
((SELECT id FROM categories WHERE slug='tacos'), 'Taco de maciza', 'Carne maciza de borrego.', 36),
((SELECT id FROM categories WHERE slug='tacos'), 'Taco de cabeza', 'Elige ojo, sesos, lengua o cachete.', 38),
((SELECT id FROM categories WHERE slug='consomes'), 'Consomé sencillo', 'Incluye arroz y garbanzo.', 65),
((SELECT id FROM categories WHERE slug='consomes'), 'Consomé sencillo chico', 'Incluye arroz y garbanzo.', 50),
((SELECT id FROM categories WHERE slug='consomes'), 'Consomé con carne', 'Incluye arroz, garbanzo y carne.', 100),
((SELECT id FROM categories WHERE slug='consomes'), 'Consomé con carne chico', 'Incluye arroz, garbanzo y carne.', 85),
((SELECT id FROM categories WHERE slug='consomes'), 'Consomé mixto', 'Carne y pancita; incluye arroz y garbanzo.', 100),
((SELECT id FROM categories WHERE slug='consomes'), 'Consomé mixto chico', 'Carne y pancita; incluye arroz y garbanzo.', 85),
((SELECT id FROM categories WHERE slug='consomes'), 'Consomé con maciza', 'Incluye arroz, garbanzo y maciza.', 105),
((SELECT id FROM categories WHERE slug='consomes'), 'Consomé con maciza chico', 'Incluye arroz, garbanzo y maciza.', 90),
((SELECT id FROM categories WHERE slug='barbacoa-kilos'), 'Maciza - 1 kg', 'Un kilogramo de barbacoa maciza.', 720),
((SELECT id FROM categories WHERE slug='barbacoa-kilos'), 'Maciza - 1/2 kg', 'Medio kilogramo de barbacoa maciza.', 380),
((SELECT id FROM categories WHERE slug='barbacoa-kilos'), 'Maciza - 1/4 kg', 'Un cuarto de kilogramo de barbacoa maciza.', 200),
((SELECT id FROM categories WHERE slug='barbacoa-kilos'), 'Surtida - 1 kg', 'Un kilogramo de barbacoa surtida.', 680),
((SELECT id FROM categories WHERE slug='barbacoa-kilos'), 'Surtida - 1/2 kg', 'Medio kilogramo de barbacoa surtida.', 360),
((SELECT id FROM categories WHERE slug='barbacoa-kilos'), 'Surtida - 1/4 kg', 'Un cuarto de kilogramo de barbacoa surtida.', 190),
((SELECT id FROM categories WHERE slug='barbacoa-kilos'), 'Pancita - 1 kg', 'Un kilogramo de pancita.', 600),
((SELECT id FROM categories WHERE slug='barbacoa-kilos'), 'Pancita - 1/2 kg', 'Medio kilogramo de pancita.', 310),
((SELECT id FROM categories WHERE slug='barbacoa-kilos'), 'Pancita - 1/4 kg', 'Un cuarto de kilogramo de pancita.', 170),
((SELECT id FROM categories WHERE slug='especialidades'), 'Mixiotes', 'Aprox. 200 g de carne y costilla de borrego adobada, envuelta en tela de maguey y acompañada de arroz.', 160),
((SELECT id FROM categories WHERE slug='especialidades'), 'Flautas', 'Orden de 4 flautas de barbacoa con lechuga, salsa verde, queso y crema.', 180),
((SELECT id FROM categories WHERE slug='especialidades'), 'Carne asada', 'Aprox. 200 g de carne y costilla asada de borrego con pico de gallo.', 160),
((SELECT id FROM categories WHERE slug='especialidades'), 'Longaniza', 'Aprox. 200 g de longaniza de borrego asada al carbón.', 140),
((SELECT id FROM categories WHERE slug='especialidades'), 'Machitos', 'Aprox. 200 g de vísceras de borrego marinadas, asadas y fritas hasta dorar.', 140),
((SELECT id FROM categories WHERE slug='especialidades'), 'Quesadilla', 'Masa de maíz de aprox. 25 cm rellena con queso de hebra.', 100),
((SELECT id FROM categories WHERE slug='especialidades'), 'Quesadilla con champiñones', 'Queso de hebra y champiñones.', 120),
((SELECT id FROM categories WHERE slug='especialidades'), 'Quesadilla con carne', 'Queso de hebra y carne a elegir: surtida, pancita, longaniza o tripa.', 140),
((SELECT id FROM categories WHERE slug='especialidades'), 'Quesadilla especial', 'Queso de hebra con maciza, cabeza, carne asada o combinación mixta.', 150),
((SELECT id FROM categories WHERE slug='bebidas'), 'Coca-Cola', 'Refresco.', 31),
((SELECT id FROM categories WHERE slug='bebidas'), 'Coca-Cola Light', 'Refresco sin azúcar.', 31),
((SELECT id FROM categories WHERE slug='bebidas'), 'Peñafiel', 'Agua mineral.', 31),
((SELECT id FROM categories WHERE slug='bebidas'), 'Boing', 'Bebida de fruta.', 31),
((SELECT id FROM categories WHERE slug='bebidas'), 'Agua fresca', 'Pregunta por la fruta de temporada.', 28),
((SELECT id FROM categories WHERE slug='extras-postre'), 'Queso extra', 'Porción adicional de queso.', 10),
((SELECT id FROM categories WHERE slug='extras-postre'), 'Recipiente para llevar', 'Recipiente individual.', 5),
((SELECT id FROM categories WHERE slug='extras-postre'), 'Postre', 'Postre de la casa.', 30);
