import {
  type ChangeEvent,
  type DragEvent,
  type InputHTMLAttributes,
  useCallback,
  useRef,
  useState,
} from "react";

import { formatBytes } from "@/helpers/file-format";
import type {
  FileMetadata,
  FileSelectionState,
  FileUploadActions,
  FileUploadOptions,
  FileWithPreview,
} from "@/types/file-upload";

export const useFileUpload = (
  options: FileUploadOptions = {},
): [FileSelectionState, FileUploadActions] => {
  const {
    maxFiles = Number.POSITIVE_INFINITY,
    maxSize = Number.POSITIVE_INFINITY,
    accept = "*",
    multiple = false,
    replaceExisting = true,
    initialFiles = [],
    onFilesChange,
    onFilesAdded,
  } = options;

  const [state, setState] = useState<FileSelectionState>({
    errors: [],
    files: initialFiles.map((file) => ({
      file,
      id: file.id,
      preview: file.url,
    })),
    isDragging: false,
  });

  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback(
    (file: File | FileMetadata): string | null => {
      if (file.size > maxSize) {
        return `File "${file.name}" exceeds the maximum size of ${formatBytes(maxSize)}.`;
      }

      if (accept !== "*") {
        const acceptedTypes = accept.split(",").map((type) => type.trim());
        const fileType = file instanceof File ? file.type || "" : file.type;
        const fileExtension = `.${file.name.split(".").pop()}`;

        const isAccepted = acceptedTypes.some((type) => {
          if (type.startsWith(".")) {
            return fileExtension.toLowerCase() === type.toLowerCase();
          }
          if (type.endsWith("/*")) {
            const baseType = type.split("/")[0];
            return fileType.startsWith(`${baseType}/`);
          }
          return fileType === type;
        });

        if (!isAccepted) {
          return `File "${file.name}" is not an accepted file type.`;
        }
      }

      return null;
    },
    [accept, maxSize],
  );

  const createPreview = useCallback((file: File | FileMetadata) => {
    if (file instanceof File) {
      return URL.createObjectURL(file);
    }
    return file.url;
  }, []);

  const generateUniqueId = useCallback((file: File | FileMetadata): string => {
    if (file instanceof File) {
      return file.name;
    }
    return file.id;
  }, []);

  const clearFiles = useCallback(() => {
    setState((previousState) => {
      for (const selectedFile of previousState.files) {
        if (
          selectedFile.preview &&
          selectedFile.file instanceof File &&
          selectedFile.file.type.startsWith("image/")
        ) {
          URL.revokeObjectURL(selectedFile.preview);
        }
      }

      if (inputRef.current) {
        inputRef.current.value = "";
      }

      const nextState = {
        ...previousState,
        errors: [],
        files: [],
      };

      onFilesChange?.(nextState.files);
      return nextState;
    });
  }, [onFilesChange]);

  const addFiles = useCallback(
    (newFiles: FileList | File[]) => {
      if (!newFiles || newFiles.length === 0) return;

      const newFilesArray = Array.from(newFiles);
      const errors: string[] = [];

      setState((previousState) => ({ ...previousState, errors: [] }));

      if (!multiple && !replaceExisting && state.files.length > 0) {
        setState((previousState) => ({
          ...previousState,
          errors: [
            "Only one file can be uploaded at a time. Remove the current file before selecting another.",
          ],
        }));

        if (inputRef.current) {
          inputRef.current.value = "";
        }

        return;
      }

      if (!multiple) {
        clearFiles();
      }

      if (
        multiple &&
        maxFiles !== Number.POSITIVE_INFINITY &&
        state.files.length + newFilesArray.length > maxFiles
      ) {
        errors.push(`You can only upload a maximum of ${maxFiles} files.`);
        setState((previousState) => ({ ...previousState, errors }));
        return;
      }

      const validFiles: FileWithPreview[] = [];

      for (const file of newFilesArray) {
        if (multiple) {
          const isDuplicate = state.files.some(
            (existingFile) =>
              existingFile.file.name === file.name &&
              existingFile.file.size === file.size,
          );

          if (isDuplicate) continue;
        }

        const error = validateFile(file);
        if (error) {
          errors.push(error);
          continue;
        }

        validFiles.push({
          file,
          id: generateUniqueId(file),
          preview: createPreview(file),
        });
      }

      if (validFiles.length > 0) {
        onFilesAdded?.(validFiles);

        setState((previousState) => {
          const nextFiles = multiple
            ? [...previousState.files, ...validFiles]
            : validFiles;
          onFilesChange?.(nextFiles);
          return { ...previousState, errors, files: nextFiles };
        });
      } else if (errors.length > 0) {
        setState((previousState) => ({ ...previousState, errors }));
      }

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    },
    [
      clearFiles,
      createPreview,
      generateUniqueId,
      maxFiles,
      multiple,
      onFilesAdded,
      onFilesChange,
      replaceExisting,
      state.files,
      validateFile,
    ],
  );

  const removeFile = useCallback(
    (id: string) => {
      setState((previousState) => {
        const fileToRemove = previousState.files.find(
          (selectedFile) => selectedFile.id === id,
        );
        if (
          fileToRemove?.preview &&
          fileToRemove.file instanceof File &&
          fileToRemove.file.type.startsWith("image/")
        ) {
          URL.revokeObjectURL(fileToRemove.preview);
        }

        const nextFiles = previousState.files.filter(
          (selectedFile) => selectedFile.id !== id,
        );
        onFilesChange?.(nextFiles);

        return { ...previousState, errors: [], files: nextFiles };
      });
    },
    [onFilesChange],
  );

  const clearErrors = useCallback(() => {
    setState((previousState) => ({ ...previousState, errors: [] }));
  }, []);

  const handleDragEnter = useCallback((event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setState((previousState) => ({ ...previousState, isDragging: true }));
  }, []);

  const handleDragLeave = useCallback((event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (event.currentTarget.contains(event.relatedTarget as Node)) return;

    setState((previousState) => ({ ...previousState, isDragging: false }));
  }, []);

  const handleDragOver = useCallback((event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setState((previousState) => ({ ...previousState, isDragging: false }));

      if (inputRef.current?.disabled) return;

      if (event.dataTransfer.files.length > 0) {
        addFiles(
          multiple ? event.dataTransfer.files : [event.dataTransfer.files[0]],
        );
      }
    },
    [addFiles, multiple],
  );

  const handleFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      if (event.target.files && event.target.files.length > 0) {
        addFiles(event.target.files);
      }
    },
    [addFiles],
  );

  const openFileDialog = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const getInputProps = useCallback(
    (props: InputHTMLAttributes<HTMLInputElement> = {}) => ({
      ...props,
      accept: props.accept || accept,
      multiple: props.multiple !== undefined ? props.multiple : multiple,
      onChange: handleFileChange,
      // Cast to `any` to prevent mismatched React ref type errors across workspaces
      // biome-ignore lint/suspicious/noExplicitAny: intentional
      ref: inputRef as any,
      type: "file" as const,
    }),
    [accept, handleFileChange, multiple],
  );

  return [
    state,
    {
      addFiles,
      clearErrors,
      clearFiles,
      getInputProps,
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      handleFileChange,
      openFileDialog,
      removeFile,
    },
  ];
};
