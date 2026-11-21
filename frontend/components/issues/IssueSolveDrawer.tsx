"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerBody,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { Issue, User } from "@/lib/types";
import { useState } from "react";

const schema = z.object({
  note: z.string().min(3, "Say a bit more"),
  addTodo: z.boolean().optional(),
  todoTitle: z.string().optional(),
  todoDueDate: z.string().optional(),
  todoOwnerId: z.string().optional(),
});

type FormVals = z.infer<typeof schema>;

export function IssueSolveDrawer({
  issue,
  users,
  open,
  onOpenChange,
  onSubmit,
}: {
  issue: Issue | null;
  users: User[];
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSubmit: (v: { note: string; todo?: { title: string; dueDate: string; ownerId: string } }) => void;
}) {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormVals>({
    resolver: zodResolver(schema),
    defaultValues: { note: "", addTodo: false },
  });
  const [addTodo, setAddTodo] = useState(false);

  function submit(v: FormVals) {
    const todo =
      v.addTodo && v.todoTitle && v.todoDueDate && v.todoOwnerId
        ? { title: v.todoTitle, dueDate: v.todoDueDate, ownerId: v.todoOwnerId }
        : undefined;
    onSubmit({ note: v.note, todo });
    reset();
    setAddTodo(false);
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <div className="caps mb-1">Solve issue</div>
          <DrawerTitle>{issue?.title ?? "—"}</DrawerTitle>
        </DrawerHeader>

        <form onSubmit={handleSubmit(submit)}>
          <DrawerBody className="space-y-6 pb-32">
            <div>
              <label className="caps mb-2 block">Resolution note</label>
              <textarea
                {...register("note")}
                rows={5}
                placeholder="What did we agree to? What's the decision?"
                className="w-full rounded-md border border-[var(--hair)] bg-transparent p-3 text-[13px] outline-none focus:border-ink/60 resize-none"
              />
              {errors.note && (
                <div className="mt-1 text-[11px] text-rose-500">{errors.note.message}</div>
              )}
            </div>

            <div className="border-t border-[var(--hair)] pt-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={addTodo}
                  onCheckedChange={(v) => setAddTodo(!!v)}
                />
                <input type="hidden" {...register("addTodo")} value={addTodo ? "true" : ""} />
                <span className="text-[13px]">Also add a to-do</span>
              </label>

              {addTodo && (
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="caps mb-1 block">Title</label>
                    <Input
                      {...register("todoTitle")}
                      placeholder="What needs to happen"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="caps mb-1 block">Due</label>
                      <Input type="date" {...register("todoDueDate")} />
                    </div>
                    <div>
                      <label className="caps mb-1 block">Owner</label>
                      <select
                        {...register("todoOwnerId")}
                        className="h-8 w-full rounded-md border border-[var(--hair)] bg-transparent px-2 text-[13px] outline-none focus:border-ink/60"
                      >
                        <option value="">—</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </DrawerBody>

          <DrawerFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Mark solved
            </Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
