/**
 * ქეშირების კონფიგურაცია საიტის სხვადასხვა ნაწილებისთვის
 */

// სტატიკური გვერდების ქეშირების დროის პერიოდი (24 საათი)
export const STATIC_PAGE_REVALIDATE_TIME = 86400;

// დინამიური მონაცემების ქეშირების დროის პერიოდი (5 წუთი)
export const DYNAMIC_DATA_REVALIDATE_TIME = 300;

// ოთახების მონაცემების ქეშირების დროის პერიოდი (1 საათი)
export const ROOMS_REVALIDATE_TIME = 3600;

// ღვინის მონაცემების ქეშირების დროის პერიოდი (3 საათი)
export const WINES_REVALIDATE_TIME = 10800;

// გალერეის მონაცემების ქეშირების დროის პერიოდი (6 საათი)
export const GALLERY_REVALIDATE_TIME = 21600;

// ქეშირების ტაგები, რომლებიც გამოიყენება revalidate-ისთვის
export const CACHE_TAGS = {
  rooms: 'rooms',
  wines: 'wines',
  gallery: 'gallery',
  dining: 'dining',
  bookings: 'bookings',
}; 