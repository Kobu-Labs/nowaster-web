import type {
  CreateReleaseRequest,
  UpdateReleaseRequest,
} from "@/api/definitions/requests/release";
import * as ReleaseApi from "@/api/releaseApi";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useLatestUnseenRelease = () => {
  return useQuery({
    queryKey: ["releases", "latest-unseen"],
    queryFn: ReleaseApi.getLatestUnseenRelease,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
};

export const useAllReleases = () => {
  return useQuery({
    queryKey: ["releases", "admin", "all"],
    queryFn: ReleaseApi.listAllReleases,
  });
};

export const useRelease = (releaseId: string) => {
  return useQuery({
    queryKey: ["releases", "admin", releaseId],
    queryFn: () => ReleaseApi.getRelease(releaseId),
    enabled: !!releaseId,
  });
};

export const useCreateRelease = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateReleaseRequest) =>
      ReleaseApi.createRelease(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["releases", "admin"] });
      queryClient.invalidateQueries({ queryKey: ["releases", "public"] });
    },
  });
};

export const useUpdateRelease = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      releaseId,
      request,
    }: {
      releaseId: string;
      request: UpdateReleaseRequest;
    }) => ReleaseApi.updateRelease(releaseId, request),
    onSuccess: (_, { releaseId }) => {
      queryClient.invalidateQueries({
        queryKey: ["releases", "admin", releaseId],
      });
      queryClient.invalidateQueries({ queryKey: ["releases", "admin", "all"] });
      queryClient.invalidateQueries({ queryKey: ["releases", "public"] });
    },
  });
};

export const useDeleteRelease = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (releaseId: string) => ReleaseApi.deleteRelease(releaseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["releases", "admin"] });
      queryClient.invalidateQueries({ queryKey: ["releases", "public"] });
    },
  });
};

export const usePublishRelease = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (releaseId: string) => ReleaseApi.publishRelease(releaseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["releases"] });
    },
  });
};

export const useUnpublishRelease = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (releaseId: string) => ReleaseApi.unpublishRelease(releaseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["releases"] });
    },
  });
};
