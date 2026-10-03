import "server-only";

export interface DepartmentDTO {
  id: string;
  slug: string;
  name: string;
  isVisible: boolean;
  order: number;
}

export interface DepartmentShape {
  id: string;
  slug: string;
  name: string;
  isVisible: boolean;
  order: number;
}

export function toDepartmentDTO(department: DepartmentShape): DepartmentDTO {
  return {
    id: department.id,
    slug: department.slug,
    name: department.name,
    isVisible: department.isVisible,
    order: department.order,
  };
}