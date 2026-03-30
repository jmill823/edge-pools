"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CategoryEditor,
  CategoryData,
  GolferData,
} from "@/components/CategoryEditor";

interface PoolInfo {
  id: string;
  name: string;
  status: string;
  isOrganizer: boolean;
}

export default function EditCategoriesPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [pool, setPool] = useState<PoolInfo | null>(null);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [golfers, setGolfers] = useState<GolferData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [poolRes, catsRes, golfersRes] = await Promise.all([
        fetch(`/api/pools/${params.id}`),
        fetch(`/api/pools/${params.id}/categories`),
        fetch("/api/golfers"),
      ]);

      if (!poolRes.ok) {
        setError("Pool not found");
        setLoading(false);
        return;
      }

      const poolData = await poolRes.json();
      setPool({
        id: poolData.id,
        name: poolData.name,
        status: poolData.status,
        isOrganizer: poolData.isOrganizer,
      });

      if (catsRes.ok) {
        setCategories(await catsRes.json());
      }

      if (golfersRes.ok) {
        setGolfers(await golfersRes.json());
      }
    } catch {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function handleChange(updated: CategoryData[]) {
    setCategories(updated);
    setDirty(true);
  }

  async function save() {
    setSaving(true);
    setError(null);

    try {
      const payload = {
        categories: categories.map((c) => ({
          name: c.name,
          sortOrder: c.sortOrder,
          golferIds: c.golfers.map((g) => g.id),
        })),
      };

      const res = await fetch(`/api/pools/${params.id}/categories`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save");
        return;
      }

      setDirty(false);
      router.push(`/pool/${params.id}/manage`);
    } catch {
      setError("Failed to save categories");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center text-green-600">
        Loading...
      </div>
    );
  }

  if (error && !pool) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <h1 className="text-xl font-bold text-red-800">{error}</h1>
      </div>
    );
  }

  if (!pool?.isOrganizer) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <h1 className="text-xl font-bold text-green-900">Access Denied</h1>
        <p className="mt-2 text-sm text-green-600">
          Only the pool organizer can edit categories.
        </p>
      </div>
    );
  }

  if (pool.status !== "SETUP") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <h1 className="text-xl font-bold text-green-900">Editing Locked</h1>
        <p className="mt-2 text-sm text-green-600">
          Categories can only be edited while the pool is in SETUP status.
        </p>
        <Link
          href={`/pool/${pool.id}/manage`}
          className="mt-4 inline-block text-sm font-medium text-green-700 hover:text-green-900"
        >
          &larr; Back to Pool Management
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-green-900">
            Edit Categories
          </h1>
          <p className="mt-1 text-sm text-green-600">{pool.name}</p>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-6">
        <CategoryEditor
          categories={categories}
          availableGolfers={golfers}
          onChange={handleChange}
        />
      </div>

      {/* Save / Cancel bar */}
      <div className="mt-6 flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
        <button
          onClick={save}
          disabled={saving || !dirty || categories.length === 0}
          className="rounded-md bg-green-800 px-5 py-2 text-sm font-medium text-white hover:bg-green-900 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Categories"}
        </button>
        <Link
          href={`/pool/${params.id}/manage`}
          className="rounded-md border border-green-300 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-100"
        >
          Cancel
        </Link>
        {dirty && (
          <span className="text-xs text-amber-600">Unsaved changes</span>
        )}
      </div>
    </div>
  );
}
