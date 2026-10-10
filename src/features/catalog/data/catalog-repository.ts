import { nullIfNotFound } from "@/core/http/api-error";
import type { HttpClient } from "@/core/http/http-client";
import { toPaginated, type HydraCollection, type Paginated } from "@/core/http/hydra";
import type { Money } from "@/core/money";
import type { Category, Product, ProductQuery } from "../domain/types";

export interface CatalogRepository {
  listCategories(): Promise<Category[]>;
  listProducts(query: ProductQuery): Promise<Paginated<Product>>;
  findProduct(id: string): Promise<Product | null>;
}

/** API Platform's default page size for products. */
export const PRODUCTS_PER_PAGE = 30;

type CategoryDto = { id: string; name: string; slug: string };

type ProductDto = {
  id: string;
  sku: string;
  name: string;
  description?: string | null;
  category: CategoryDto;
  price: Money;
  stock: number;
  active: boolean;
};

/** Maps the API's JSON-LD to domain objects, so components never depend on the wire format. */
export const catalogMapper = {
  category: ({ id, name, slug }: CategoryDto): Category => ({ id, name, slug }),
  product: (dto: ProductDto): Product => ({
    id: dto.id,
    sku: dto.sku,
    name: dto.name,
    description: dto.description ?? null,
    category: catalogMapper.category(dto.category),
    price: { amount: dto.price.amount, currency: dto.price.currency },
    stock: dto.stock,
    active: dto.active,
  }),
};

export class ApiCatalogRepository implements CatalogRepository {
  constructor(private readonly http: HttpClient) {}

  async listCategories(): Promise<Category[]> {
    const collection = await this.http.get<HydraCollection<CategoryDto>>("/categories");
    return collection.member.map(catalogMapper.category);
  }

  async listProducts({ categorySlug, page = 1 }: ProductQuery): Promise<Paginated<Product>> {
    const query = new URLSearchParams({ page: String(page) });
    if (categorySlug) query.set("category.slug", categorySlug);
    const collection = await this.http.get<HydraCollection<ProductDto>>(`/products?${query}`);
    return toPaginated(collection, catalogMapper.product, page, PRODUCTS_PER_PAGE);
  }

  async findProduct(id: string): Promise<Product | null> {
    const dto = await nullIfNotFound(this.http.get<ProductDto>(`/products/${encodeURIComponent(id)}`));
    return dto ? catalogMapper.product(dto) : null;
  }
}
