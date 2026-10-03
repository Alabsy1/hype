import "server-only";

import { prisma } from "@/lib/server/prisma";
import { toDepartmentDTO } from "@/lib/server/dto/department.dto";
import type { DepartmentDTO } from "@/lib/server/dto/department.dto";
import { toDataLayerError } from "@/lib/server/errors/data-layer-error";
import type {
  DepartmentCreateInput,
  DepartmentUpdateInput,
} from "@/lib/server/schemas/department.schema";

export async function getDepartmentBySlug(slug: string): Promise<DepartmentDTO | null> {
  const department = await prisma.department.findUnique({ where: { slug } });
  return department ? toDepartmentDTO(department) : null;
}

export async function getVisibleDepartmentBySlug(slug: string): Promise<DepartmentDTO | null> {
  const department = await prisma.department.findFirst({
    where: { slug, isVisible: true },
  });
  return department ? toDepartmentDTO(department) : null;
}

export async function listDepartments(): Promise<DepartmentDTO[]> {
  const departments = await prisma.department.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
  });
  return departments.map(toDepartmentDTO);
}

export async function listVisibleDepartments(): Promise<DepartmentDTO[]> {
  const departments = await prisma.department.findMany({
    where: { isVisible: true },
    orderBy: [{ order: "asc" }, { name: "asc" }],
  });
  return departments.map(toDepartmentDTO);
}

export async function createDepartment(input: DepartmentCreateInput): Promise<DepartmentDTO> {
  try {
    const department = await prisma.department.create({ data: input });
    return toDepartmentDTO(department);
  } catch (error) {
    throw toDataLayerError(error);
  }
}

export async function updateDepartment(
  id: string,
  input: DepartmentUpdateInput,
): Promise<DepartmentDTO> {
  try {
    const department = await prisma.department.update({ where: { id }, data: input });
    return toDepartmentDTO(department);
  } catch (error) {
    throw toDataLayerError(error);
  }
}