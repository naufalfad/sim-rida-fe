import { create } from 'zustand';
import { Category, INITIAL_CATEGORIES } from '../mock/knowledge-base/categories';
import { externalSourceService, ExternalSource } from '../services/externalSource.service';

export interface Document {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  opdScope: 'ALL' | 'SPECIFIC';
  specificOpds: string[];
  year: number;
  createdAt: string;
  createdById: string;
  createdBy: string;
  updatedAt: string;
  updatedById: string;
  updatedBy: string;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED' | 'EXPIRED';
}

export interface Version {
  id: string;
  documentId: string;
  version: string;
  year: number;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED' | 'EXPIRED';
  uploadedDate: string;
  uploadedBy: string;
  changeSummary: string;
  fileName: string;
  fileSize: string;
  filePath?: string;
}

export interface UpdateLog {
  id: string;
  date: string;
  documentName: string;
  version: string;
  action: string;
  user: string;
  changeSummary: string;
}

interface KnowledgeBaseState {
  documents: Document[];
  versions: Version[];
  categories: Category[];
  activities: UpdateLog[];
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;

  // Actions
  fetchDocuments: () => Promise<void>;
  fetchDocumentDetail: (id: string) => Promise<Document | null>;
  addDocument: (
    docData: Omit<Document, 'id' | 'createdAt' | 'createdById' | 'createdBy' | 'updatedAt' | 'updatedById' | 'updatedBy' | 'status'>,
    versionNumber: string,
    fileName: string,
    changeSummary: string,
    userName: string
  ) => Promise<void>;

  uploadNewVersion: (
    documentId: string,
    versionNumber: string,
    year: number,
    fileName: string,
    changeSummary: string,
    userName: string
  ) => Promise<void>;

  setActiveVersion: (documentId: string, versionId: string, userName: string) => void;
  archiveDocument: (documentId: string, userName: string) => Promise<void>;

  // Category Actions
  addCategory: (name: string) => void;
  editCategory: (id: string, name: string, status: 'ACTIVE' | 'INACTIVE') => void;
  deleteCategory: (id: string) => { success: boolean; hasDocuments: boolean };
}

const mapExternalSourceToDoc = (source: ExternalSource): Document => {
  let categoryId = 'cat-1';
  if (source.sourceType === 'REGULATION') categoryId = 'cat-5';
  else if (source.sourceType === 'STATISTICAL_DATA') categoryId = 'cat-4';
  else if (source.sourceType === 'RESEARCH_REPORT') categoryId = 'cat-6';
  else if (source.sourceType === 'GOVERNMENT_REPORT') categoryId = 'cat-8';
  else if (source.sourceType === 'STRATEGIC_PLAN') categoryId = 'cat-2';
  else if (source.sourceType === 'PLANNING_DOCUMENT') {
    const t = (source.title || '').toLowerCase();
    if (t.includes('renstra')) categoryId = 'cat-2';
    else if (t.includes('renja')) categoryId = 'cat-3';
    else categoryId = 'cat-1';
  }

  const createdAt = source.createdAt
    ? new Date(source.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    : '2026';
  const updatedAt = source.updatedAt
    ? new Date(source.updatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    : '2026';

  let docYear = 2026;
  if (source.currentVersion?.effectiveDate) {
    docYear = new Date(source.currentVersion.effectiveDate).getFullYear();
  } else if (source.title.match(/202[0-9]/)) {
    docYear = parseInt(source.title.match(/202[0-9]/)![0], 10);
  }

  return {
    id: source.id,
    name: source.title,
    description: source.description || '',
    categoryId,
    opdScope: (source.code?.startsWith('BASELINE-') || !source.institution || source.institution.includes('Pemerintah') || source.institution.includes('Bappeda') || source.institution.includes('BRIDA') || source.institution.includes('Kompilasi') || source.institution.includes('SKPD')) ? 'ALL' : 'SPECIFIC',
    specificOpds: source.institution ? [source.institution] : [],
    year: docYear,
    createdAt,
    createdById: source.createdBy?.id || 'u-1',
    createdBy: source.createdBy?.name || 'BRIDA Litbang',
    updatedAt,
    updatedById: source.createdBy?.id || 'u-1',
    updatedBy: source.createdBy?.name || 'BRIDA Litbang',
    status: (source.status as any) || 'ACTIVE',
  };
};

export const useKnowledgeBaseStore = create<KnowledgeBaseState>((set, get) => ({
  documents: [],
  versions: [],
  categories: INITIAL_CATEGORIES,
  activities: [],
  isLoading: false,
  isLoaded: false,
  error: null,

  fetchDocuments: async () => {
    set({ isLoading: true, error: null });
    try {
      const sources = await externalSourceService.getAll({ limit: 100 });
      const mappedDocs = sources.map(mapExternalSourceToDoc);

      const allVersions: Version[] = [];
      sources.forEach((s) => {
        let docYear = 2026;
        if (s.currentVersion?.effectiveDate) {
          docYear = new Date(s.currentVersion.effectiveDate).getFullYear();
        } else if (s.title.match(/202[0-9]/)) {
          docYear = parseInt(s.title.match(/202[0-9]/)![0], 10);
        }

        if (s.versions && Array.isArray(s.versions) && s.versions.length > 0) {
          s.versions.forEach((v: any) => {
            const rawPath = v.document?.filePath;
            const fullFilePath = rawPath
              ? (rawPath.startsWith('http') ? rawPath : `http://localhost:5000/${rawPath.replace(/^\/?/, '')}`)
              : undefined;

            allVersions.push({
              id: v.id,
              documentId: s.id,
              version: `${v.versionNumber || '1'}.0`,
              year: docYear,
              status: s.currentVersionId === v.id ? 'ACTIVE' : 'ARCHIVED',
              uploadedDate: v.createdAt
                ? new Date(v.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                : '2026',
              uploadedBy: v.uploadedBy?.name || 'BRIDA Litbang',
              changeSummary: v.description || 'Pembaruan berkas',
              fileName: v.document?.fileName || 'dokumen.pdf',
              fileSize: v.document?.fileSize
                ? `${(v.document.fileSize / 1024 / 1024).toFixed(2)} MB`
                : '1.5 MB',
              filePath: fullFilePath,
            });
          });
        } else if (s.currentVersion) {
          const cv = s.currentVersion;
          const rawPath = cv.document?.filePath;
          const fullFilePath = rawPath
            ? (rawPath.startsWith('http') ? rawPath : `http://localhost:5000/${rawPath.replace(/^\/?/, '')}`)
            : undefined;

          allVersions.push({
            id: cv.id,
            documentId: s.id,
            version: `${cv.versionNumber || '1'}.0`,
            year: docYear,
            status: 'ACTIVE',
            uploadedDate: cv.createdAt
              ? new Date(cv.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
              : '2026',
            uploadedBy: 'BRIDA Litbang',
            changeSummary: 'Versi aktif baseline resmi',
            fileName: cv.document?.fileName || 'dokumen.pdf',
            fileSize: cv.document?.fileSize
              ? `${(cv.document.fileSize / 1024 / 1024).toFixed(2)} MB`
              : '1.5 MB',
            filePath: fullFilePath,
          });
        }
      });

      set({
        documents: mappedDocs,
        versions: allVersions,
        isLoading: false,
        isLoaded: true,
      });
    } catch (err: any) {
      set({
        isLoading: false,
        error: err.message || 'Gagal memuat dokumen sumber eksternal',
      });
    }
  },

  fetchDocumentDetail: async (id: string) => {
    try {
      const source = await externalSourceService.getById(id);
      if (!source) return null;
      const mappedDoc = mapExternalSourceToDoc(source);

      let docYear = mappedDoc.year;
      const newVersions: Version[] = [];

      if (source.versions && Array.isArray(source.versions) && source.versions.length > 0) {
        source.versions.forEach((v: any) => {
          const rawPath = v.document?.filePath;
          const fullFilePath = rawPath
            ? (rawPath.startsWith('http') ? rawPath : `http://localhost:5000/${rawPath.replace(/^\/?/, '')}`)
            : undefined;

          newVersions.push({
            id: v.id,
            documentId: source.id,
            version: `${v.versionNumber || '1'}.0`,
            year: docYear,
            status: source.currentVersionId === v.id ? 'ACTIVE' : 'ARCHIVED',
            uploadedDate: v.createdAt
              ? new Date(v.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
              : '2026',
            uploadedBy: v.uploadedBy?.name || 'BRIDA Litbang',
            changeSummary: v.description || 'Pembaruan berkas',
            fileName: v.document?.fileName || 'dokumen.pdf',
            fileSize: v.document?.fileSize
              ? `${(v.document.fileSize / 1024 / 1024).toFixed(2)} MB`
              : '1.5 MB',
            filePath: fullFilePath,
          });
        });
      } else if (source.currentVersion) {
        const cv = source.currentVersion;
        const rawPath = cv.document?.filePath;
        const fullFilePath = rawPath
          ? (rawPath.startsWith('http') ? rawPath : `http://localhost:5000/${rawPath.replace(/^\/?/, '')}`)
          : undefined;

        newVersions.push({
          id: cv.id,
          documentId: source.id,
          version: `${cv.versionNumber || '1'}.0`,
          year: docYear,
          status: 'ACTIVE',
          uploadedDate: cv.createdAt
            ? new Date(cv.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
            : '2026',
          uploadedBy: 'BRIDA Litbang',
          changeSummary: 'Versi aktif baseline resmi',
          fileName: cv.document?.fileName || 'dokumen.pdf',
          fileSize: cv.document?.fileSize
            ? `${(cv.document.fileSize / 1024 / 1024).toFixed(2)} MB`
            : '1.5 MB',
          filePath: fullFilePath,
        });
      }

      set((state) => ({
        documents: state.documents.some((d) => d.id === mappedDoc.id)
          ? state.documents.map((d) => (d.id === mappedDoc.id ? mappedDoc : d))
          : [...state.documents, mappedDoc],
        versions: [
          ...state.versions.filter((v) => v.documentId !== source.id),
          ...newVersions,
        ],
      }));

      return mappedDoc;
    } catch (err: any) {
      console.error('Error fetching document detail:', err);
      return null;
    }
  },

  addDocument: async (docData, versionNumber, fileName, changeSummary, userName) => {
    try {
      const code = `EXT-${Date.now().toString().slice(-6)}`;
      await externalSourceService.create({
        code,
        title: docData.name,
        description: docData.description,
        sourceType: 'PLANNING_DOCUMENT',
        institution: docData.specificOpds?.[0] || undefined,
      });
      await get().fetchDocuments();
    } catch (err: any) {
      console.error('Error adding document:', err);
      throw err;
    }
  },

  uploadNewVersion: async (documentId, versionNumber, year, fileName, changeSummary, userName) => {
    try {
      const formData = new FormData();
      formData.append('versionNumber', versionNumber.replace(/^v/, ''));
      formData.append('description', changeSummary);
      const dummyBlob = new Blob(['Dokumen pembaruan sumber eksternal'], { type: 'text/plain' });
      formData.append('file', dummyBlob, fileName || 'dokumen.txt');

      await externalSourceService.uploadVersion(documentId, formData);
      await get().fetchDocuments();
    } catch (err: any) {
      console.error('Error uploading version:', err);
    }
  },

  setActiveVersion: (documentId, versionId, userName) => {
    set((state) => ({
      versions: state.versions.map((v) =>
        v.documentId === documentId
          ? { ...v, status: v.id === versionId ? 'ACTIVE' : 'ARCHIVED' }
          : v
      ),
    }));
  },

  archiveDocument: async (documentId, userName) => {
    try {
      await externalSourceService.update(documentId, { status: 'ARCHIVED' });
      await get().fetchDocuments();
    } catch (err: any) {
      console.error('Error archiving document:', err);
    }
  },

  addCategory: (name: string) => {
    const newCat: Category = {
      id: `cat-${Date.now()}`,
      name,
      status: 'ACTIVE',
      lastUpdated: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
    };
    set((state) => ({ categories: [...state.categories, newCat] }));
  },

  editCategory: (id: string, name: string, status: 'ACTIVE' | 'INACTIVE') => {
    set((state) => ({
      categories: state.categories.map((c) =>
        c.id === id
          ? { ...c, name, status, lastUpdated: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) }
          : c
      ),
    }));
  },

  deleteCategory: (id: string) => {
    const { documents, categories } = get();
    const hasDocs = documents.some((d) => d.categoryId === id);
    if (hasDocs) return { success: false, hasDocuments: true };

    set({ categories: categories.filter((c) => c.id !== id) });
    return { success: true, hasDocuments: false };
  },
}));

if (typeof window !== 'undefined') {
  setTimeout(() => {
    if (!useKnowledgeBaseStore.getState().isLoaded) {
      useKnowledgeBaseStore.getState().fetchDocuments();
    }
  }, 0);
}

