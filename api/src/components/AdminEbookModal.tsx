import React, { useState, useEffect } from 'react';
import { Ebook, PublicationType, ComboItem, BonusItem, Category } from '../types';
import { apiRequest, uploadFile } from '../lib/api';
import {
  X,
  Upload,
  Check,
  AlertCircle,
  BookOpen,
  FileText,
  Gift,
  Ticket,
  Sparkles,
  Layers,
  Percent,
  Plus,
  Trash2,
  Package,
  BookMarked,
  ArrowRight,
  TrendingDown,
  ChevronUp,
  ChevronDown,
  FolderTree,
  ExternalLink
} from 'lucide-react';

interface AdminEbookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onSaved?: () => void;
  ebookToEdit?: Ebook | null;
  initialData?: Ebook | null;
  allEbooks?: Ebook[];
}

export const AdminEbookModal: React.FC<AdminEbookModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onSaved,
  ebookToEdit,
  initialData,
  allEbooks: providedCatalog = []
}) => {
  const targetEbook = ebookToEdit || initialData;
  const isEditMode = Boolean(targetEbook && targetEbook.id);
  const [activeTab, setActiveTab] = useState<'general' | 'combo' | 'bonus' | 'coupon'>('general');

  // Categories dynamic list
  const [categories, setCategories] = useState<Category[]>([]);
  const [catalogList, setCatalogList] = useState<Ebook[]>(providedCatalog);

  // Publication Type
  const [publicationType, setPublicationType] = useState<PublicationType>('SINGLE');

  // Core Ebook Info
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState('Technology & Engineering');
  const [price, setPrice] = useState('499');
  const [totalOriginalValue, setTotalOriginalValue] = useState<string>('999');
  const [currency, setCurrency] = useState('INR');
  const [pageCount, setPageCount] = useState('240');
  const [fileSize, setFileSize] = useState('12.4 MB');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [sampleChapter, setSampleChapter] = useState('');
  const [featured, setFeatured] = useState(false);
  const [published, setPublished] = useState(true);

  // Combo Items List (for COMBO publication type)
  const [comboItems, setComboItems] = useState<ComboItem[]>([]);

  // Multiple Bonus Volumes State
  const [hasBonus, setHasBonus] = useState(false);
  const [bonusItems, setBonusItems] = useState<BonusItem[]>([]);

  // Inline Coupon State
  const [enableCoupon, setEnableCoupon] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscountPercentage, setCouponDiscountPercentage] = useState('25');
  const [couponExpiresAt, setCouponExpiresAt] = useState(
    new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [couponUnlimited, setCouponUnlimited] = useState(true);
  const [couponUsageLimit, setCouponUsageLimit] = useState('100');

  // Loading & Upload States
  const [loading, setLoading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [uploadingItemIndex, setUploadingItemIndex] = useState<{ type: 'combo' | 'bonus'; index: number; target: 'cover' | 'pdf' } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch dynamic categories and catalog ebooks when modal opens
  useEffect(() => {
    if (!isOpen) return;

    // Fetch categories
    apiRequest<{ categories: Category[] }>('/api/admin/categories')
      .then(res => {
        if (res.categories && res.categories.length > 0) {
          setCategories(res.categories);
        }
      })
      .catch(() => {
        // Fallback to public categories
        apiRequest<{ categories: string[] }>('/api/ebooks/categories')
          .then(res => {
            if (res.categories) {
              setCategories(res.categories.map((c, i) => ({
                id: `cat-${i}`,
                name: c,
                slug: c.toLowerCase().replace(/[^a-z0-9]/g, '-'),
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              })));
            }
          })
          .catch(() => {});
      });

    // Fetch catalog list if empty
    if (providedCatalog.length === 0) {
      apiRequest<{ ebooks: Ebook[] }>('/api/admin/ebooks')
        .then(res => {
          if (res.ebooks) setCatalogList(res.ebooks);
        })
        .catch(() => {});
    } else {
      setCatalogList(providedCatalog);
    }
  }, [isOpen, providedCatalog]);

  // Synchronize state when modal opens or targetEbook changes
  useEffect(() => {
    if (targetEbook) {
      // PREFILL ALL EXISTING DATA ACCURATELY
      const pubType = targetEbook.publicationType || (targetEbook.comboItems && targetEbook.comboItems.length > 0 ? 'COMBO' : 'SINGLE');
      setPublicationType(pubType);

      setTitle(targetEbook.title || '');
      setDescription(targetEbook.description || '');
      setAuthor(targetEbook.author || '');
      setCategory(targetEbook.category || 'Technology & Engineering');
      setPrice(targetEbook.price !== undefined ? targetEbook.price.toString() : '499');
      setTotalOriginalValue(targetEbook.totalOriginalValue ? targetEbook.totalOriginalValue.toString() : (targetEbook.price * 1.5).toString());
      setCurrency(targetEbook.currency || 'INR');
      setPageCount(targetEbook.pageCount ? targetEbook.pageCount.toString() : '240');
      setFileSize(targetEbook.fileSize || '12.4 MB');
      setCoverImageUrl(targetEbook.coverImageUrl || '');
      setPdfUrl(targetEbook.pdfUrl || '');
      setSampleChapter(targetEbook.sampleChapter || '');
      setFeatured(Boolean(targetEbook.featured));
      setPublished(targetEbook.published !== undefined ? Boolean(targetEbook.published) : true);

      // Combo items prefilling
      if (targetEbook.comboItems && targetEbook.comboItems.length > 0) {
        setComboItems(targetEbook.comboItems.map((item, idx) => ({
          id: item.id || `citem-${Date.now()}-${idx}`,
          sourceType: item.sourceType || (item.ebookId && catalogList.some(e => e.id === item.ebookId && e.publicationType !== 'COMBO') ? 'catalog' : 'custom'),
          ebookId: item.ebookId,
          title: item.title || '',
          author: item.author || '',
          category: item.category || targetEbook.category || 'Technology & Engineering',
          description: item.description || '',
          price: item.price !== undefined ? item.price : 399,
          pageCount: item.pageCount || 150,
          fileSize: item.fileSize || '10 MB',
          coverImageUrl: item.coverImageUrl || '',
          pdfUrl: item.pdfUrl || '',
          pdfFileName: item.pdfFileName || (item.pdfUrl ? 'Attached-Volume.pdf' : '')
        })));
      } else {
        setComboItems([]);
      }

      // Bonus items prefilling (support multiple bonus volumes or legacy single bonus)
      const existingBonusItems: BonusItem[] = [];
      if (targetEbook.bonusItems && targetEbook.bonusItems.length > 0) {
        setBonusItems(targetEbook.bonusItems.map((bItem, idx) => ({
          id: bItem.id || `bitem-${Date.now()}-${idx}`,
          sourceType: bItem.sourceType || (bItem.ebookId && catalogList.some(e => e.id === bItem.ebookId) ? 'existing' : 'custom'),
          ebookId: bItem.ebookId,
          title: bItem.title || '',
          author: bItem.author || targetEbook.author || '',
          category: bItem.category || targetEbook.category || 'General',
          description: bItem.description || '',
          price: bItem.price !== undefined ? bItem.price : 299,
          coverImageUrl: bItem.coverImageUrl || '',
          pdfUrl: bItem.pdfUrl || '',
          pdfFileName: bItem.pdfFileName || (bItem.pdfUrl ? 'Bonus-Companion.pdf' : ''),
          pageCount: bItem.pageCount || 50,
          fileSize: bItem.fileSize || '5.0 MB'
        })));
        setHasBonus(true);
      } else if (targetEbook.hasBonus) {
        setHasBonus(true);
        existingBonusItems.push({
          id: `bitem-${Date.now()}-0`,
          title: targetEbook.bonusTitle || 'Bonus Companion Guide',
          author: targetEbook.author || 'Editorial Staff',
          category: targetEbook.category || 'General',
          description: targetEbook.bonusDescription || 'Exclusive digital companion guide.',
          sourceType: targetEbook.bonusType === 'existing' ? 'existing' : 'custom',
          ebookId: targetEbook.bonusEbookId,
          coverImageUrl: targetEbook.bonusCoverImageUrl || targetEbook.coverImageUrl,
          pdfUrl: targetEbook.bonusPdfUrl,
          pdfFileName: targetEbook.bonusPdfUrl ? 'Bonus-Document.pdf' : '',
          pageCount: targetEbook.bonusPageCount || 50,
          fileSize: targetEbook.bonusFileSize || '4.8 MB',
          price: 299
        });
        setBonusItems(existingBonusItems);
      } else {
        setHasBonus(false);
        setBonusItems([]);
      }

      // Coupon prefilling if attached
      const activeCoupons = targetEbook.coupons || targetEbook.activeCoupons;
      if (activeCoupons && activeCoupons.length > 0) {
        const c = activeCoupons[0];
        setEnableCoupon(true);
        setCouponCode(c.code);
        setCouponDiscountPercentage(c.discountPercentage.toString());
        setCouponExpiresAt(c.expiresAt ? new Date(c.expiresAt).toISOString().split('T')[0] : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
        setCouponUnlimited(Boolean(c.unlimitedUsage));
        setCouponUsageLimit(c.usageLimit ? c.usageLimit.toString() : '100');
      } else {
        setEnableCoupon(false);
        setCouponCode('');
        setCouponDiscountPercentage('20');
      }
    } else {
      // Clean defaults for creating a new publication
      setPublicationType('SINGLE');
      setTitle('');
      setDescription('');
      setAuthor('');
      setCategory('Technology & Engineering');
      setPrice('499');
      setTotalOriginalValue('999');
      setCurrency('INR');
      setPageCount('220');
      setFileSize('10.5 MB');
      setCoverImageUrl('https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=900&q=80');
      setPdfUrl('');
      setSampleChapter('Chapter 1: The Foundation of Modern Systems. In this comprehensive guide...');
      setFeatured(false);
      setPublished(true);

      // Combo defaults
      setComboItems([]);

      // Bonus defaults
      setHasBonus(false);
      setBonusItems([]);

      // Coupon defaults
      setEnableCoupon(false);
      setCouponCode('');
      setCouponDiscountPercentage('20');
    }
    setError(null);
    setActiveTab('general');
  }, [targetEbook, isOpen]);

  // Recalculate combo original value whenever comboItems change
  useEffect(() => {
    if (publicationType === 'COMBO' && comboItems.length > 0) {
      const sum = comboItems.reduce((acc, item) => acc + (Number(item.price) || 0), 0);
      if (sum > 0) {
        setTotalOriginalValue(sum.toString());
      }
    }
  }, [comboItems, publicationType]);

  if (!isOpen) return null;

  const handleCoverFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    setError(null);
    try {
      const res = await uploadFile(file);
      setCoverImageUrl(res.url);
    } catch (err: any) {
      setError(err.message || 'Failed to upload cover image');
    } finally {
      setUploadingCover(false);
    }
  };

  const handlePdfFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setError('Please select a valid PDF document (*.pdf)');
      return;
    }
    setUploadingPdf(true);
    setError(null);
    try {
      const res = await uploadFile(file);
      setPdfUrl(res.url);
      setFileSize(res.fileSize);
    } catch (err: any) {
      setError(err.message || 'Failed to upload PDF file to Cloudinary');
    } finally {
      setUploadingPdf(false);
    }
  };

  // Upload handler for sub-items (Combo or Bonus)
  const handleItemFileUpload = async (
    type: 'combo' | 'bonus',
    index: number,
    target: 'cover' | 'pdf',
    file: File
  ) => {
    if (target === 'pdf' && !file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setError('Please select a valid PDF file (*.pdf)');
      return;
    }

    setUploadingItemIndex({ type, index, target });
    setError(null);
    try {
      const res = await uploadFile(file);
      if (type === 'combo') {
        const updated = [...comboItems];
        if (target === 'cover') {
          updated[index].coverImageUrl = res.url;
        } else {
          updated[index].pdfUrl = res.url;
          updated[index].fileSize = res.fileSize;
          updated[index].pdfFileName = res.filename || file.name;
        }
        setComboItems(updated);
      } else {
        const updated = [...bonusItems];
        if (target === 'cover') {
          updated[index].coverImageUrl = res.url;
        } else {
          updated[index].pdfUrl = res.url;
          updated[index].fileSize = res.fileSize;
          updated[index].pdfFileName = res.filename || file.name;
        }
        setBonusItems(updated);
      }
    } catch (err: any) {
      setError(err.message || `Failed to upload ${target} to Cloudinary`);
    } finally {
      setUploadingItemIndex(null);
    }
  };

  // --- COMBO BUILDER ACTIONS ---

  const handleAddNewVolume = () => {
    const newItem: ComboItem = {
      id: `citem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      sourceType: 'custom',
      title: '',
      author: author || '',
      category: category || (categories[0]?.name || 'Technology & Engineering'),
      description: '',
      price: 399,
      pageCount: 150,
      fileSize: '10 MB',
      coverImageUrl: '',
      pdfUrl: '',
      pdfFileName: ''
    };
    setComboItems([...comboItems, newItem]);
    setError(null);
  };

  const handleVolumeSourceToggle = (index: number, sourceType: 'catalog' | 'custom') => {
    const updated = [...comboItems];
    const current = updated[index];
    if (sourceType === 'catalog') {
      updated[index] = {
        ...current,
        sourceType: 'catalog',
        ebookId: current.ebookId || ''
      };
    } else {
      updated[index] = {
        ...current,
        sourceType: 'custom',
        ebookId: undefined,
        title: current.title || '',
        author: current.author || author || '',
        category: current.category || category || 'Technology & Engineering',
        description: current.description || '',
        price: current.price !== undefined ? current.price : 399,
        pageCount: current.pageCount || 150,
        fileSize: current.fileSize || '10 MB',
        coverImageUrl: current.coverImageUrl || '',
        pdfUrl: current.pdfUrl || '',
        pdfFileName: current.pdfFileName || ''
      };
    }
    setComboItems(updated);
  };

  const handleSelectCatalogBookForVolume = (index: number, bookId: string) => {
    const selected = catalogList.find(eb => eb.id === bookId);
    if (!selected) return;

    const alreadyUsed = comboItems.some((item, i) => i !== index && item.ebookId === bookId);
    if (alreadyUsed) {
      setError(`The catalog book "${selected.title}" is already included in another volume.`);
      return;
    }

    const updated = [...comboItems];
    updated[index] = {
      ...updated[index],
      sourceType: 'catalog',
      ebookId: selected.id,
      title: selected.title,
      author: selected.author,
      category: selected.category,
      description: selected.description,
      price: selected.price,
      pageCount: selected.pageCount,
      fileSize: selected.fileSize,
      coverImageUrl: selected.coverImageUrl,
      pdfUrl: selected.pdfUrl
    };
    setComboItems(updated);
    setError(null);
  };

  const handleUpdateComboItem = (index: number, field: keyof ComboItem, value: any) => {
    const updated = [...comboItems];
    updated[index] = { ...updated[index], [field]: value };
    setComboItems(updated);
  };

  const handleMoveComboItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= comboItems.length) return;
    const updated = [...comboItems];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setComboItems(updated);
  };

  const handleRemoveComboItem = (index: number) => {
    setComboItems(comboItems.filter((_, i) => i !== index));
  };

  // --- BONUS BUILDER ACTIONS ---

  const handleAddNewBonusItem = () => {
    const newItem: BonusItem = {
      id: `bitem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      sourceType: 'custom',
      title: '',
      author: author || '',
      category: category || 'General',
      description: '',
      price: 299,
      pageCount: 50,
      fileSize: '5.0 MB',
      coverImageUrl: '',
      pdfUrl: '',
      pdfFileName: ''
    };
    setBonusItems([...bonusItems, newItem]);
    setHasBonus(true);
    setError(null);
  };

  const handleBonusSourceToggle = (index: number, sourceType: 'existing' | 'custom') => {
    const updated = [...bonusItems];
    const current = updated[index];
    if (sourceType === 'existing') {
      updated[index] = {
        ...current,
        sourceType: 'existing',
        ebookId: current.ebookId || ''
      };
    } else {
      updated[index] = {
        ...current,
        sourceType: 'custom',
        ebookId: undefined,
        title: current.title || '',
        author: current.author || author || '',
        category: current.category || category || 'General',
        description: current.description || '',
        price: current.price !== undefined ? current.price : 299,
        pageCount: current.pageCount || 50,
        fileSize: current.fileSize || '5.0 MB',
        coverImageUrl: current.coverImageUrl || '',
        pdfUrl: current.pdfUrl || '',
        pdfFileName: current.pdfFileName || ''
      };
    }
    setBonusItems(updated);
  };

  const handleSelectCatalogBookForBonus = (index: number, bookId: string) => {
    const selected = catalogList.find(eb => eb.id === bookId);
    if (!selected) return;

    const alreadyUsed = bonusItems.some((item, i) => i !== index && item.ebookId === bookId);
    if (alreadyUsed) {
      setError(`The catalog book "${selected.title}" is already attached as a bonus.`);
      return;
    }

    const updated = [...bonusItems];
    updated[index] = {
      ...updated[index],
      sourceType: 'existing',
      ebookId: selected.id,
      title: selected.title,
      author: selected.author,
      category: selected.category,
      description: selected.description || 'Included free as a bonus companion edition.',
      price: selected.price,
      pageCount: selected.pageCount,
      fileSize: selected.fileSize,
      coverImageUrl: selected.coverImageUrl,
      pdfUrl: selected.pdfUrl
    };
    setBonusItems(updated);
    setError(null);
  };

  const handleUpdateBonusItem = (index: number, field: keyof BonusItem, value: any) => {
    const updated = [...bonusItems];
    updated[index] = { ...updated[index], [field]: value };
    setBonusItems(updated);
  };

  const handleMoveBonusItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= bonusItems.length) return;
    const updated = [...bonusItems];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setBonusItems(updated);
  };

  const handleRemoveBonusItem = (index: number) => {
    const updated = bonusItems.filter((_, i) => i !== index);
    setBonusItems(updated);
    if (updated.length === 0) {
      setHasBonus(false);
    }
  };

  // --- SUBMIT PUBLICATION ---

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !description.trim() || !coverImageUrl.trim()) {
      setError('Please provide a title, synopsis description, and cover image');
      setActiveTab('general');
      return;
    }

    // PDF validation for single publications
    if (publicationType === 'SINGLE' && !pdfUrl.trim()) {
      setError('Please upload a PDF document for this publication');
      setActiveTab('general');
      return;
    }

    // Validation for Combo Publications
    if (publicationType === 'COMBO') {
      if (comboItems.length < 2) {
        setError('A Combo Package must contain at least 2 volumes. Please add volumes in the Combo Builder tab.');
        setActiveTab('combo');
        return;
      }

      for (let i = 0; i < comboItems.length; i++) {
        const v = comboItems[i];
        const volNum = i + 1;
        const isCatalog = v.sourceType === 'catalog';

        if (isCatalog) {
          if (!v.ebookId) {
            setError(`Volume ${volNum}: Please select a book from the catalog.`);
            setActiveTab('combo');
            return;
          }
          const bookExists = catalogList.some(eb => eb.id === v.ebookId);
          if (!bookExists) {
            setError(`Volume ${volNum}: This catalog book is no longer available. Please select another book.`);
            setActiveTab('combo');
            return;
          }
        } else {
          if (!v.title || !v.title.trim()) {
            setError(`Volume ${volNum}: Please enter a title for the custom volume.`);
            setActiveTab('combo');
            return;
          }
          if (!v.description || !v.description.trim()) {
            setError(`Volume ${volNum}: Please enter a description for the custom volume.`);
            setActiveTab('combo');
            return;
          }
          if (!v.author || !v.author.trim()) {
            setError(`Volume ${volNum}: Please enter an author for the custom volume.`);
            setActiveTab('combo');
            return;
          }
          if (!v.coverImageUrl || !v.coverImageUrl.trim()) {
            setError(`Volume ${volNum}: Please provide or upload a cover image.`);
            setActiveTab('combo');
            return;
          }
          if (!v.pdfUrl || !v.pdfUrl.trim()) {
            setError(`Volume ${volNum}: Please upload the PDF for this volume.`);
            setActiveTab('combo');
            return;
          }
        }
      }
    }

    // Validation for Bonus items
    if (hasBonus && bonusItems.length > 0) {
      for (let i = 0; i < bonusItems.length; i++) {
        const b = bonusItems[i];
        const bonusNum = i + 1;
        const isCatalog = b.sourceType === 'existing' || b.sourceType === 'catalog';

        if (isCatalog) {
          if (!b.ebookId) {
            setError(`Bonus ${bonusNum}: Please select a book from the catalog.`);
            setActiveTab('bonus');
            return;
          }
          const bookExists = catalogList.some(eb => eb.id === b.ebookId);
          if (!bookExists) {
            setError(`Bonus ${bonusNum}: This catalog book is no longer available. Please select another book.`);
            setActiveTab('bonus');
            return;
          }
        } else {
          if (!b.title || !b.title.trim()) {
            setError(`Bonus ${bonusNum}: Please enter a title for the custom bonus guide.`);
            setActiveTab('bonus');
            return;
          }
          if (!b.pdfUrl || !b.pdfUrl.trim()) {
            setError(`Bonus ${bonusNum}: Please upload the PDF for this bonus volume.`);
            setActiveTab('bonus');
            return;
          }
        }
      }
    }

    if (enableCoupon && (!couponCode.trim() || !couponDiscountPercentage)) {
      setError('Please provide a valid coupon code and discount percentage');
      setActiveTab('coupon');
      return;
    }

    setLoading(true);

    try {
      const primaryBonus = bonusItems[0];
      const payload: any = {
        title: title.trim(),
        description: description.trim(),
        author: author.trim() || 'Editorial Staff',
        category: category.trim(),
        price: Number(price),
        currency,
        publicationType,
        totalOriginalValue: publicationType === 'COMBO' ? Number(totalOriginalValue) : undefined,
        comboItems: publicationType === 'COMBO' ? comboItems : [],
        pageCount: Number(pageCount),
        fileSize,
        coverImageUrl: coverImageUrl.trim(),
        pdfUrl: pdfUrl.trim() || undefined,
        sampleChapter: sampleChapter.trim(),
        featured,
        published,

        // Bonus Fields (Supports both multiple bonusItems array and legacy single bonus)
        hasBonus: Boolean(hasBonus && bonusItems.length > 0),
        bonusItems: hasBonus && bonusItems.length > 0 ? bonusItems : [],
        bonusType: primaryBonus ? primaryBonus.sourceType : 'custom',
        bonusEbookId: primaryBonus?.sourceType === 'existing' ? primaryBonus.ebookId : undefined,
        bonusTitle: primaryBonus ? primaryBonus.title.trim() : undefined,
        bonusDescription: primaryBonus ? primaryBonus.description?.trim() : undefined,
        bonusCoverImageUrl: primaryBonus ? primaryBonus.coverImageUrl?.trim() : undefined,
        bonusPdfUrl: primaryBonus ? primaryBonus.pdfUrl?.trim() || undefined : undefined,
        bonusPageCount: primaryBonus ? Number(primaryBonus.pageCount) || 50 : undefined,
        bonusFileSize: primaryBonus ? primaryBonus.fileSize : undefined,

        // Inline Coupon Fields
        enableCoupon,
        couponCode: enableCoupon ? couponCode.toUpperCase().trim() : undefined,
        couponDiscountPercentage: enableCoupon ? Number(couponDiscountPercentage) : undefined,
        couponExpiresAt: enableCoupon ? new Date(couponExpiresAt).toISOString() : undefined,
        couponUnlimited,
        couponUsageLimit: Number(couponUsageLimit) || 100
      };

      if (isEditMode && targetEbook) {
        await apiRequest(`/api/admin/ebooks/${targetEbook.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        await apiRequest('/api/admin/ebooks', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }

      if (onSuccess) onSuccess();
      if (onSaved) onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save publication');
    } finally {
      setLoading(false);
    }
  };

  const otherEbooks = catalogList.filter(eb => !targetEbook || eb.id !== targetEbook.id);
  const calculatedSavings = publicationType === 'COMBO' && Number(totalOriginalValue) > Number(price)
    ? Math.round(((Number(totalOriginalValue) - Number(price)) / Number(totalOriginalValue)) * 100)
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#1A1817]/70 backdrop-blur-xs overflow-y-auto">
      <div
        id="admin-ebook-modal-card"
        className="relative w-full max-w-4xl my-6 bg-[#FBF9F5] border border-[#E8E2D9] shadow-2xl rounded-2xl overflow-hidden p-5 sm:p-7 space-y-5 max-h-[92vh] flex flex-col animate-fade-in"
      >
        {/* Header - Distinctly highlighting Edit vs Add Mode */}
        <div className="flex items-center justify-between border-b border-[#E8E2D9] pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${isEditMode ? 'bg-[#8B2635] text-white' : 'bg-[#8B2635]/10 text-[#8B2635]'}`}>
              {publicationType === 'COMBO' ? <Package className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="modal-heading-title" className="font-serif text-xl sm:text-2xl font-bold text-[#1A1817]">
                  {isEditMode ? 'Edit Publication' : 'Add New Publication'}
                </h2>
                {isEditMode && (
                  <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[#8B2635]/10 text-[#8B2635] rounded border border-[#8B2635]/20">
                    ID: {targetEbook?.id}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#736B63]">
                {isEditMode
                  ? 'Update publication details, combo volumes, bonus guides, or promotional coupons.'
                  : 'Publish a single standalone book or a multi-volume discounted combo kit.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#9E9589] hover:text-[#1A1817] hover:bg-[#F0EBE1] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span className="flex-1">{error}</span>
            <button type="button" onClick={() => setError(null)} className="text-red-500 hover:text-red-800">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-[#E8E2D9] gap-1 shrink-0 overflow-x-auto">
          <button
            type="button"
            id="tab-btn-general"
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'general'
                ? 'bg-white border-t border-x border-[#E8E2D9] text-[#8B2635] shadow-2xs font-bold'
                : 'text-[#736B63] hover:text-[#1A1817] hover:bg-[#F0EBE1]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            1. Publication Info
          </button>

          {publicationType === 'COMBO' && (
            <button
              type="button"
              id="tab-btn-combo"
              onClick={() => setActiveTab('combo')}
              className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'combo'
                  ? 'bg-white border-t border-x border-[#E8E2D9] text-indigo-700 shadow-2xs font-bold'
                  : 'text-[#736B63] hover:text-[#1A1817] hover:bg-[#F0EBE1]'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              2. Combo Builder ({comboItems.length} Volumes)
            </button>
          )}

          <button
            type="button"
            id="tab-btn-bonus"
            onClick={() => setActiveTab('bonus')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'bonus'
                ? 'bg-white border-t border-x border-[#E8E2D9] text-purple-700 shadow-2xs font-bold'
                : 'text-[#736B63] hover:text-[#1A1817] hover:bg-[#F0EBE1]'
            }`}
          >
            <Gift className="w-3.5 h-3.5" />
            {hasBonus && bonusItems.length > 0 ? `Bonus Books (${bonusItems.length})` : 'Bonus Books'}
          </button>

          <button
            type="button"
            id="tab-btn-coupon"
            onClick={() => setActiveTab('coupon')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'coupon'
                ? 'bg-white border-t border-x border-[#E8E2D9] text-emerald-700 shadow-2xs font-bold'
                : 'text-[#736B63] hover:text-[#1A1817] hover:bg-[#F0EBE1]'
            }`}
          >
            <Ticket className="w-3.5 h-3.5" />
            {enableCoupon ? `Coupon (${couponCode || 'Active'})` : 'Promotional Coupon'}
          </button>
        </div>

        {/* Modal Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-1 space-y-5">
          {/* TAB 1: CORE PUBLICATION INFO */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              {/* Publication Format Selector */}
              <div className="p-4 bg-white border border-[#E8E2D9] rounded-xl space-y-2">
                <label className="block text-xs font-bold text-[#4A443E] uppercase tracking-wider">
                  Publication Format Architecture *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      publicationType === 'SINGLE'
                        ? 'bg-[#FAF8F5] border-[#8B2635] ring-1 ring-[#8B2635]'
                        : 'bg-white border-[#E8E2D9] hover:bg-[#FBF9F5]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="publicationType"
                      value="SINGLE"
                      checked={publicationType === 'SINGLE'}
                      onChange={() => setPublicationType('SINGLE')}
                      className="mt-1 accent-[#8B2635]"
                    />
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-xs text-[#1A1817]">
                        <BookOpen className="w-3.5 h-3.5 text-[#8B2635]" /> Single Standalone Ebook
                      </div>
                      <p className="text-[11px] text-[#736B63] mt-0.5">
                        Standard single book title with dedicated cover and primary PDF document.
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      publicationType === 'COMBO'
                        ? 'bg-indigo-50/70 border-indigo-600 ring-1 ring-indigo-600'
                        : 'bg-white border-[#E8E2D9] hover:bg-[#FBF9F5]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="publicationType"
                      value="COMBO"
                      checked={publicationType === 'COMBO'}
                      onChange={() => setPublicationType('COMBO')}
                      className="mt-1 accent-indigo-600"
                    />
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-xs text-indigo-950">
                        <Package className="w-3.5 h-3.5 text-indigo-600" /> Multi-Volume Combo Kit
                      </div>
                      <p className="text-[11px] text-indigo-800 mt-0.5">
                        Bundles multiple individual books into 1 package. Grants multi-item library access.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Title & Author */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#4A443E] uppercase tracking-wider mb-1">
                    {publicationType === 'COMBO' ? 'Combo Package Title *' : 'Book Title *'}
                  </label>
                  <input
                    id="input-ebook-title"
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={publicationType === 'COMBO' ? 'e.g. Master Cloud & Microservices Kit' : 'e.g. The Art of Modern Architecture'}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#DCD5C9] rounded-lg focus:outline-none focus:border-[#8B2635] text-[#1A1817]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#4A443E] uppercase tracking-wider mb-1">
                    Author(s) / Editorial Byline *
                  </label>
                  <input
                    id="input-ebook-author"
                    type="text"
                    required
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="e.g. Eleanor Vance & Devon Hayes"
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#DCD5C9] rounded-lg focus:outline-none focus:border-[#8B2635] text-[#1A1817]"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-[#4A443E] uppercase tracking-wider mb-1">
                  Editorial Synopsis & Description *
                </label>
                <textarea
                  id="textarea-ebook-desc"
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed synopsis of the publication..."
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#DCD5C9] rounded-lg focus:outline-none focus:border-[#8B2635] text-[#1A1817]"
                />
              </div>

              {/* Dynamic Category, Selling Price, Total Original Value */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#4A443E] uppercase tracking-wider mb-1">
                    Category *
                  </label>
                  <select
                    id="select-ebook-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#DCD5C9] rounded-lg focus:outline-none focus:border-[#8B2635] text-[#1A1817]"
                  >
                    {categories.length > 0 ? (
                      categories.map(cat => (
                        <option key={cat.id || cat.name} value={cat.name}>
                          {cat.name}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="Technology & Engineering">Technology & Engineering</option>
                        <option value="Typography & Design">Typography & Design</option>
                        <option value="Business & Strategy">Business & Strategy</option>
                        <option value="Philosophy & Science">Philosophy & Science</option>
                        <option value="Arts & Architecture">Arts & Architecture</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#4A443E] uppercase tracking-wider mb-1">
                    Selling Price (₹ INR) *
                  </label>
                  <input
                    id="input-ebook-price"
                    type="number"
                    min="0"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#DCD5C9] rounded-lg focus:outline-none focus:border-[#8B2635] font-bold text-[#1A1817]"
                  />
                </div>

                {publicationType === 'COMBO' ? (
                  <div>
                    <label className="block text-xs font-semibold text-indigo-900 uppercase tracking-wider mb-1 flex items-center justify-between">
                      <span>Combined Original Value</span>
                      {calculatedSavings > 0 && (
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.2 rounded">
                          Save {calculatedSavings}%
                        </span>
                      )}
                    </label>
                    <input
                      id="input-ebook-original-value"
                      type="number"
                      min="0"
                      value={totalOriginalValue}
                      onChange={(e) => setTotalOriginalValue(e.target.value)}
                      placeholder="e.g. 1499"
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-indigo-50/50 border border-indigo-200 rounded-lg text-[#1A1817] font-semibold"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-[#4A443E] uppercase tracking-wider mb-1">
                      Total Page Count
                    </label>
                    <input
                      id="input-ebook-pages"
                      type="number"
                      min="1"
                      value={pageCount}
                      onChange={(e) => setPageCount(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#DCD5C9] rounded-lg focus:outline-none focus:border-[#8B2635] text-[#1A1817]"
                    />
                  </div>
                )}
              </div>

              {/* Cover Image */}
              <div className="p-4 bg-white border border-[#E8E2D9] rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-[#4A443E] uppercase tracking-wider">
                    {publicationType === 'COMBO' ? 'Combo Banner / Cover Image *' : 'Book Cover Image *'}
                  </label>
                  {coverImageUrl && (
                    <span className="text-xs text-green-700 flex items-center gap-1 font-medium">
                      <Check className="w-3.5 h-3.5" /> Cover Attached
                    </span>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-3 items-center">
                  <input
                    id="input-ebook-cover-url"
                    type="url"
                    value={coverImageUrl}
                    onChange={(e) => setCoverImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="flex-1 px-3 py-2 text-xs sm:text-sm bg-[#FBF9F5] border border-[#DCD5C9] rounded-lg focus:outline-none focus:border-[#8B2635] text-[#1A1817] w-full"
                  />
                  <label className="shrink-0 px-4 py-2 text-xs font-semibold bg-[#F0EBE1] hover:bg-[#E3DBCF] text-[#1A1817] border border-[#D5CEC5] rounded-lg cursor-pointer transition-colors flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    {uploadingCover ? 'Uploading...' : 'Upload Image'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* PDF Document File */}
              <div className="p-4 bg-white border border-[#E8E2D9] rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-[#4A443E] uppercase tracking-wider">
                    {publicationType === 'COMBO' ? 'Master Package PDF Overview (Optional)' : 'Main PDF Document File'}
                  </label>
                  {pdfUrl && (
                    <span className="text-xs text-green-700 flex items-center gap-1 font-medium">
                      <Check className="w-3.5 h-3.5" /> PDF Configured
                    </span>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-3 items-center">
                  <input
                    id="input-ebook-pdf-url"
                    type="text"
                    value={pdfUrl}
                    onChange={(e) => setPdfUrl(e.target.value)}
                    placeholder="Auto-generated editorial watermarked PDF or /uploads/..."
                    className="flex-1 px-3 py-2 text-xs sm:text-sm bg-[#FBF9F5] border border-[#DCD5C9] rounded-lg focus:outline-none focus:border-[#8B2635] text-[#1A1817] w-full"
                  />
                  <label className="shrink-0 px-4 py-2 text-xs font-semibold bg-[#F0EBE1] hover:bg-[#E3DBCF] text-[#1A1817] border border-[#D5CEC5] rounded-lg cursor-pointer transition-colors flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    {uploadingPdf ? 'Uploading...' : 'Upload PDF'}
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={handlePdfFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Sample Excerpt */}
              <div>
                <label className="block text-xs font-semibold text-[#4A443E] uppercase tracking-wider mb-1">
                  Sample Excerpt Preview
                </label>
                <textarea
                  id="textarea-ebook-sample"
                  rows={2}
                  value={sampleChapter}
                  onChange={(e) => setSampleChapter(e.target.value)}
                  placeholder="Sample chapter text shown to prospective readers..."
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#DCD5C9] rounded-lg focus:outline-none focus:border-[#8B2635] text-[#1A1817]"
                />
              </div>

              {/* Status Toggles */}
              <div className="flex flex-wrap items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    id="checkbox-ebook-published"
                    type="checkbox"
                    checked={published}
                    onChange={(e) => setPublished(e.target.checked)}
                    className="w-4 h-4 text-[#8B2635] rounded focus:ring-[#8B2635] cursor-pointer accent-[#8B2635]"
                  />
                  <span className="text-xs font-medium text-[#1A1817]">Published (Visible on storefront)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    id="checkbox-ebook-featured"
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="w-4 h-4 text-[#8B2635] rounded focus:ring-[#8B2635] cursor-pointer accent-[#8B2635]"
                  />
                  <span className="text-xs font-medium text-[#1A1817]">Featured Promotion on Homepage</span>
                </label>
              </div>
            </div>
          )}

          {/* TAB 2: COMBO BUILDER */}
          {activeTab === 'combo' && (
            <div className="space-y-5">
              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-indigo-600 text-white shrink-0">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-indigo-950">
                      Combo Package Builder ({comboItems.length} Included Volumes)
                    </h3>
                    <p className="text-xs text-indigo-800">
                      Assemble individual catalog books and custom volumes into one complete discounted package.
                    </p>
                  </div>
                </div>
                <div className="text-left sm:text-right shrink-0">
                  <span className="text-xs font-bold text-indigo-950 block">Combo Price: ₹{price}</span>
                  <span className="text-[11px] text-indigo-700">Combined Value: ₹{totalOriginalValue}</span>
                </div>
              </div>

              {/* Volumes Container */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#4A443E] uppercase tracking-wider">
                    Volumes In This Combo ({comboItems.length})
                  </h4>
                </div>

                {comboItems.length === 0 ? (
                  <div className="p-8 text-center bg-white border border-dashed border-[#DCD5C9] rounded-xl space-y-2">
                    <Package className="w-8 h-8 text-[#9E9589] mx-auto" />
                    <p className="text-xs text-[#736B63] font-medium">No volumes added to this combo kit yet.</p>
                    <p className="text-[11px] text-[#9E9589]">Click "+ Add Volume" below to include catalog books or custom volumes.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {comboItems.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        id={`combo-volume-card-${idx}`}
                        className="p-4 sm:p-5 bg-white border border-[#E8E2D9] rounded-xl shadow-2xs space-y-4 animate-fade-in"
                      >
                        {/* Card Header */}
                        <div className="flex items-center justify-between border-b border-[#F0EBE1] pb-3">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 text-[11px] font-bold flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <span className="text-xs font-bold text-[#1A1817]">Volume #{idx + 1}</span>
                            {item.sourceType === 'catalog' ? (
                              <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 font-bold rounded border border-blue-200">
                                Catalog Book
                              </span>
                            ) : (
                              <span className="text-[10px] px-2 py-0.5 bg-stone-100 text-stone-700 font-bold rounded border border-stone-200">
                                Custom Volume
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => handleMoveComboItem(idx, 'up')}
                              className="p-1 text-[#736B63] hover:text-[#1A1817] disabled:opacity-30 rounded hover:bg-[#F0EBE1] cursor-pointer"
                              title="Move Up"
                            >
                              <ChevronUp className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === comboItems.length - 1}
                              onClick={() => handleMoveComboItem(idx, 'down')}
                              className="p-1 text-[#736B63] hover:text-[#1A1817] disabled:opacity-30 rounded hover:bg-[#F0EBE1] cursor-pointer"
                              title="Move Down"
                            >
                              <ChevronDown className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveComboItem(idx)}
                              className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 cursor-pointer ml-1"
                              title="Remove Volume"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Volume Source Type Toggle */}
                        <div className="flex items-center gap-2 p-1 bg-[#F5F2EC] rounded-lg w-fit border border-[#E3DBCF]">
                          <button
                            type="button"
                            onClick={() => handleVolumeSourceToggle(idx, 'catalog')}
                            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                              item.sourceType === 'catalog'
                                ? 'bg-white text-indigo-950 shadow-2xs font-bold'
                                : 'text-[#736B63] hover:text-[#1A1817]'
                            }`}
                          >
                            <BookOpen className="w-3 h-3 inline mr-1" /> Catalog Book
                          </button>
                          <button
                            type="button"
                            onClick={() => handleVolumeSourceToggle(idx, 'custom')}
                            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                              item.sourceType !== 'catalog'
                                ? 'bg-white text-indigo-950 shadow-2xs font-bold'
                                : 'text-[#736B63] hover:text-[#1A1817]'
                            }`}
                          >
                            <FileText className="w-3 h-3 inline mr-1" /> Custom Volume
                          </button>
                        </div>

                        {/* Mode 1: Catalog Book (Read-Only) */}
                        {item.sourceType === 'catalog' ? (
                          <div className="space-y-3">
                            <div>
                              <label className="block text-[11px] font-bold text-[#4A443E] uppercase tracking-wider mb-1">
                                Select Book From Store Catalog *
                              </label>
                              <select
                                value={item.ebookId || ''}
                                onChange={(e) => handleSelectCatalogBookForVolume(idx, e.target.value)}
                                className="w-full px-3 py-2 text-xs sm:text-sm bg-[#FAF8F5] border border-[#DCD5C9] rounded-lg text-[#1A1817] focus:outline-none focus:border-indigo-600"
                              >
                                <option value="">-- Choose a book from catalog --</option>
                                {otherEbooks.map(eb => (
                                  <option key={eb.id} value={eb.id}>
                                    {eb.title} (by {eb.author} • ₹{eb.price})
                                  </option>
                                ))}
                              </select>
                            </div>

                            {item.ebookId ? (
                              <div className="p-3.5 bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl flex flex-col sm:flex-row gap-3.5 items-start">
                                <img
                                  src={item.coverImageUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=300&q=80'}
                                  alt={item.title}
                                  className="w-16 h-22 object-cover rounded-md border border-[#DCD5C9] shrink-0 bg-stone-200"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="flex-1 space-y-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 font-bold rounded border border-blue-200">
                                      Catalog Linked
                                    </span>
                                    <span className="text-[10px] px-2 py-0.5 bg-[#F0EBE1] text-[#736B63] font-medium rounded">
                                      {item.category || 'General'}
                                    </span>
                                  </div>
                                  <h5 className="text-sm font-bold text-[#1A1817] truncate">{item.title}</h5>
                                  <p className="text-xs text-[#736B63]">by {item.author}</p>
                                  <p className="text-[11px] text-[#736B63] line-clamp-2">{item.description}</p>
                                  <div className="flex items-center gap-3 pt-1 text-xs">
                                    <span className="font-bold text-[#1A1817]">Individual Value: ₹{item.price}</span>
                                    <span className="text-emerald-700 font-medium flex items-center gap-1 text-[11px]">
                                      <Check className="w-3.5 h-3.5" /> PDF Available ({item.fileSize || 'Standard'})
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="p-4 text-center bg-[#FAF8F5] border border-dashed border-[#DCD5C9] rounded-xl text-xs text-[#736B63]">
                                Please select an existing catalog book from the dropdown above.
                              </div>
                            )}
                          </div>
                        ) : (
                          /* Mode 2: Custom Volume (Full Form with PDF Upload) */
                          <div className="space-y-4">
                            {/* Title & Author */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[11px] font-bold text-[#4A443E] uppercase tracking-wider mb-1">
                                  Volume Title *
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={item.title}
                                  onChange={(e) => handleUpdateComboItem(idx, 'title', e.target.value)}
                                  placeholder="e.g. Volume 1: Foundation & Core Principles"
                                  className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#DCD5C9] rounded-lg text-[#1A1817] focus:outline-none focus:border-indigo-600"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-bold text-[#4A443E] uppercase tracking-wider mb-1">
                                  Author(s) *
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={item.author}
                                  onChange={(e) => handleUpdateComboItem(idx, 'author', e.target.value)}
                                  placeholder="e.g. Lead Author / Editorial Staff"
                                  className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#DCD5C9] rounded-lg text-[#1A1817] focus:outline-none focus:border-indigo-600"
                                />
                              </div>
                            </div>

                            {/* Category & Description */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div>
                                <label className="block text-[11px] font-bold text-[#4A443E] uppercase tracking-wider mb-1">
                                  Category *
                                </label>
                                <select
                                  value={item.category || category}
                                  onChange={(e) => handleUpdateComboItem(idx, 'category', e.target.value)}
                                  className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#DCD5C9] rounded-lg text-[#1A1817] focus:outline-none focus:border-indigo-600"
                                >
                                  {categories.map((c) => (
                                    <option key={c.id || c.name} value={c.name}>
                                      {c.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="sm:col-span-2">
                                <label className="block text-[11px] font-bold text-[#4A443E] uppercase tracking-wider mb-1">
                                  Description / Overview *
                                </label>
                                <textarea
                                  rows={2}
                                  required
                                  value={item.description}
                                  onChange={(e) => handleUpdateComboItem(idx, 'description', e.target.value)}
                                  placeholder="Describe the content covered in this specific volume..."
                                  className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#DCD5C9] rounded-lg text-[#1A1817] focus:outline-none focus:border-indigo-600"
                                />
                              </div>
                            </div>

                            {/* Cover Image */}
                            <div>
                              <label className="block text-[11px] font-bold text-[#4A443E] uppercase tracking-wider mb-1">
                                Cover Image
                              </label>
                              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                                {item.coverImageUrl && (
                                  <img
                                    src={item.coverImageUrl}
                                    alt="Cover Preview"
                                    className="w-12 h-16 object-cover rounded-md border border-[#DCD5C9] shrink-0 bg-stone-200"
                                    referrerPolicy="no-referrer"
                                  />
                                )}
                                <div className="flex-1 flex gap-2 w-full">
                                  <input
                                    type="text"
                                    value={item.coverImageUrl || ''}
                                    onChange={(e) => handleUpdateComboItem(idx, 'coverImageUrl', e.target.value)}
                                    placeholder="https://images.unsplash.com/... or upload"
                                    className="flex-1 px-3 py-2 text-xs bg-[#FAF8F5] border border-[#DCD5C9] rounded-lg text-[#1A1817]"
                                  />
                                  <label className="px-3 py-2 text-xs font-semibold bg-[#F0EBE1] hover:bg-[#E3DBCF] text-[#1A1817] rounded-lg cursor-pointer flex items-center gap-1.5 shrink-0 border border-[#D5CEC5]">
                                    <Upload className="w-3.5 h-3.5" />
                                    {uploadingItemIndex?.type === 'combo' && uploadingItemIndex?.index === idx && uploadingItemIndex?.target === 'cover'
                                      ? 'Uploading...'
                                      : 'Upload Cover'}
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => {
                                        if (e.target.files?.[0]) {
                                          handleItemFileUpload('combo', idx, 'cover', e.target.files[0]);
                                        }
                                      }}
                                      className="hidden"
                                    />
                                  </label>
                                </div>
                              </div>
                            </div>

                            {/* PDF Document Upload (CRITICAL MANDATE) */}
                            <div className="p-3.5 bg-[#FAF8F5] border border-[#DCD5C9] rounded-xl space-y-2">
                              <div className="flex items-center justify-between">
                                <label className="block text-[11px] font-bold text-[#4A443E] uppercase tracking-wider">
                                  Volume PDF Document (Required) *
                                </label>
                                {item.pdfUrl && (
                                  <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                                    <Check className="w-3.5 h-3.5" /> PDF Attached
                                  </span>
                                )}
                              </div>

                              {uploadingItemIndex?.type === 'combo' && uploadingItemIndex?.index === idx && uploadingItemIndex?.target === 'pdf' ? (
                                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg flex items-center justify-center gap-2 text-xs text-indigo-900 font-medium">
                                  <span className="inline-block w-4 h-4 border-2 border-indigo-700 border-t-transparent rounded-full animate-spin"></span>
                                  Uploading PDF to Cloudinary...
                                </div>
                              ) : item.pdfUrl ? (
                                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <FileText className="w-4 h-4 text-emerald-700 shrink-0" />
                                    <span className="text-xs font-semibold text-emerald-950 truncate">
                                      {item.pdfFileName || 'Volume-Document.pdf'}
                                    </span>
                                    <span className="text-[10px] text-emerald-700 shrink-0 font-medium">
                                      ({item.fileSize || 'PDF File'})
                                    </span>
                                  </div>
                                  <label className="px-2.5 py-1 text-[11px] font-bold bg-white text-emerald-800 border border-emerald-300 rounded hover:bg-emerald-50 cursor-pointer shrink-0 transition-colors">
                                    Replace PDF
                                    <input
                                      type="file"
                                      accept="application/pdf"
                                      onChange={(e) => {
                                        if (e.target.files?.[0]) {
                                          handleItemFileUpload('combo', idx, 'pdf', e.target.files[0]);
                                        }
                                      }}
                                      className="hidden"
                                    />
                                  </label>
                                </div>
                              ) : (
                                <label className="w-full p-3 bg-white hover:bg-indigo-50/40 border border-dashed border-indigo-300 rounded-lg cursor-pointer flex items-center justify-center gap-2 text-xs font-semibold text-indigo-900 transition-colors">
                                  <Upload className="w-4 h-4 text-indigo-700" />
                                  <span>Upload Volume PDF (*.pdf)</span>
                                  <input
                                    type="file"
                                    accept="application/pdf"
                                    onChange={(e) => {
                                      if (e.target.files?.[0]) {
                                        handleItemFileUpload('combo', idx, 'pdf', e.target.files[0]);
                                      }
                                    }}
                                    className="hidden"
                                  />
                                </label>
                              )}
                            </div>

                            {/* Price & Page Count */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[11px] font-bold text-[#4A443E] uppercase tracking-wider mb-1">
                                  Individual Value / Price (₹) *
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  value={item.price}
                                  onChange={(e) => handleUpdateComboItem(idx, 'price', Number(e.target.value))}
                                  className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#DCD5C9] rounded-lg font-bold text-[#1A1817]"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-bold text-[#4A443E] uppercase tracking-wider mb-1">
                                  Page Count
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  value={item.pageCount || 150}
                                  onChange={(e) => handleUpdateComboItem(idx, 'pageCount', Number(e.target.value))}
                                  className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#DCD5C9] rounded-lg text-[#1A1817]"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Contained "+ Add Volume" Button */}
                <div className="pt-1">
                  <button
                    type="button"
                    id="btn-add-combo-volume"
                    onClick={handleAddNewVolume}
                    className="w-full py-3 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-dashed border-indigo-300 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-4 h-4" /> + Add Volume
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MULTIPLE BONUS VOLUMES */}
          {activeTab === 'bonus' && (
            <div className="space-y-5">
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-purple-600 text-white shrink-0">
                    <Gift className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-purple-950">
                      Free Bonus Digital Books / Companion Volumes ({bonusItems.length})
                    </h3>
                    <p className="text-xs text-purple-800">
                      Attach one or more free bonus books. Buyers automatically receive access to all bonus books upon purchase.
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    id="checkbox-has-bonus"
                    type="checkbox"
                    checked={hasBonus}
                    onChange={(e) => {
                      setHasBonus(e.target.checked);
                      if (e.target.checked && bonusItems.length === 0) {
                        handleAddNewBonusItem();
                      }
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-purple-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-purple-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-700"></div>
                </label>
              </div>

              {hasBonus && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-[#4A443E] uppercase tracking-wider">
                      Attached Bonus Books ({bonusItems.length})
                    </h4>
                  </div>

                  {bonusItems.length === 0 ? (
                    <div className="p-8 text-center bg-white border border-dashed border-[#DCD5C9] rounded-xl space-y-2">
                      <Gift className="w-8 h-8 text-[#9E9589] mx-auto" />
                      <p className="text-xs text-[#736B63] font-medium">No bonus companion books attached yet.</p>
                      <p className="text-[11px] text-[#9E9589]">Click "+ Add Bonus Book" below to add a bonus volume.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {bonusItems.map((bItem, idx) => (
                        <div
                          key={bItem.id || idx}
                          id={`bonus-card-${idx}`}
                          className="p-4 sm:p-5 bg-white border border-[#E8E2D9] rounded-xl shadow-2xs space-y-4 animate-fade-in"
                        >
                          {/* Card Header */}
                          <div className="flex items-center justify-between border-b border-[#F0EBE1] pb-3">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-800 text-[11px] font-bold flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>
                              <span className="text-xs font-bold text-[#1A1817]">Bonus #{idx + 1}</span>
                              {bItem.sourceType === 'existing' ? (
                                <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 font-bold rounded border border-blue-200">
                                  Catalog Book
                                </span>
                              ) : (
                                <span className="text-[10px] px-2 py-0.5 bg-purple-50 text-purple-700 font-bold rounded border border-purple-200">
                                  Custom Bonus
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleMoveBonusItem(idx, 'up')}
                                className="p-1 text-[#736B63] hover:text-[#1A1817] disabled:opacity-30 rounded hover:bg-[#F0EBE1] cursor-pointer"
                                title="Move Up"
                              >
                                <ChevronUp className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === bonusItems.length - 1}
                                onClick={() => handleMoveBonusItem(idx, 'down')}
                                className="p-1 text-[#736B63] hover:text-[#1A1817] disabled:opacity-30 rounded hover:bg-[#F0EBE1] cursor-pointer"
                                title="Move Down"
                              >
                                <ChevronDown className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveBonusItem(idx)}
                                className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 cursor-pointer ml-1"
                                title="Remove Bonus"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Source Toggle */}
                          <div className="flex items-center gap-2 p-1 bg-[#F5F2EC] rounded-lg w-fit border border-[#E3DBCF]">
                            <button
                              type="button"
                              onClick={() => handleBonusSourceToggle(idx, 'existing')}
                              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                                bItem.sourceType === 'existing'
                                  ? 'bg-white text-purple-950 shadow-2xs font-bold'
                                  : 'text-[#736B63] hover:text-[#1A1817]'
                              }`}
                            >
                              <BookOpen className="w-3 h-3 inline mr-1" /> Catalog Book
                            </button>
                            <button
                              type="button"
                              onClick={() => handleBonusSourceToggle(idx, 'custom')}
                              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                                bItem.sourceType !== 'existing'
                                  ? 'bg-white text-purple-950 shadow-2xs font-bold'
                                  : 'text-[#736B63] hover:text-[#1A1817]'
                              }`}
                            >
                              <Gift className="w-3 h-3 inline mr-1" /> Custom Bonus
                            </button>
                          </div>

                          {/* Mode 1: Catalog Bonus */}
                          {bItem.sourceType === 'existing' ? (
                            <div className="space-y-3">
                              <div>
                                <label className="block text-[11px] font-bold text-[#4A443E] uppercase tracking-wider mb-1">
                                  Select Book From Catalog As Bonus *
                                </label>
                                <select
                                  value={bItem.ebookId || ''}
                                  onChange={(e) => handleSelectCatalogBookForBonus(idx, e.target.value)}
                                  className="w-full px-3 py-2 text-xs sm:text-sm bg-[#FAF8F5] border border-[#DCD5C9] rounded-lg text-[#1A1817] focus:outline-none focus:border-purple-600"
                                >
                                  <option value="">-- Choose catalog book to offer free --</option>
                                  {otherEbooks.map(eb => (
                                    <option key={eb.id} value={eb.id}>
                                      {eb.title} (by {eb.author} • Regular ₹{eb.price})
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {bItem.ebookId ? (
                                <div className="p-3.5 bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl flex flex-col sm:flex-row gap-3.5 items-start">
                                  <img
                                    src={bItem.coverImageUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=300&q=80'}
                                    alt={bItem.title}
                                    className="w-16 h-22 object-cover rounded-md border border-[#DCD5C9] shrink-0 bg-stone-200"
                                    referrerPolicy="no-referrer"
                                  />
                                  <div className="flex-1 space-y-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-[10px] px-2 py-0.5 bg-purple-100 text-purple-800 font-bold rounded border border-purple-200">
                                        BONUS — FREE
                                      </span>
                                      <span className="text-[10px] px-2 py-0.5 bg-[#F0EBE1] text-[#736B63] font-medium rounded">
                                        {bItem.category || 'General'}
                                      </span>
                                    </div>
                                    <h5 className="text-sm font-bold text-[#1A1817] truncate">{bItem.title}</h5>
                                    <p className="text-xs text-[#736B63]">by {bItem.author}</p>
                                    <p className="text-[11px] text-[#736B63] line-clamp-2">{bItem.description}</p>
                                    <div className="flex items-center gap-3 pt-1 text-xs">
                                      <span className="text-xs text-[#736B63]">Value: ₹{bItem.price} (Included Free)</span>
                                      <span className="text-emerald-700 font-medium flex items-center gap-1 text-[11px]">
                                        <Check className="w-3.5 h-3.5" /> PDF Available ({bItem.fileSize || 'Standard'})
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="p-4 text-center bg-[#FAF8F5] border border-dashed border-[#DCD5C9] rounded-xl text-xs text-[#736B63]">
                                  Please select an existing catalog book from the dropdown above.
                                </div>
                              )}
                            </div>
                          ) : (
                            /* Mode 2: Custom Bonus (Full Form with PDF Upload) */
                            <div className="space-y-4">
                              {/* Title & Author */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-[11px] font-bold text-[#4A443E] uppercase tracking-wider mb-1">
                                    Bonus Title *
                                  </label>
                                  <input
                                    type="text"
                                    required
                                    value={bItem.title}
                                    onChange={(e) => handleUpdateBonusItem(idx, 'title', e.target.value)}
                                    placeholder="e.g. Exclusive Companion Guide & Runbook"
                                    className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#DCD5C9] rounded-lg text-[#1A1817] focus:outline-none focus:border-purple-600"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-bold text-[#4A443E] uppercase tracking-wider mb-1">
                                    Author(s)
                                  </label>
                                  <input
                                    type="text"
                                    value={bItem.author || ''}
                                    onChange={(e) => handleUpdateBonusItem(idx, 'author', e.target.value)}
                                    placeholder="e.g. Editorial Staff"
                                    className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#DCD5C9] rounded-lg text-[#1A1817] focus:outline-none focus:border-purple-600"
                                  />
                                </div>
                              </div>

                              {/* Category & Description */}
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                  <label className="block text-[11px] font-bold text-[#4A443E] uppercase tracking-wider mb-1">
                                    Category
                                  </label>
                                  <select
                                    value={bItem.category || 'General'}
                                    onChange={(e) => handleUpdateBonusItem(idx, 'category', e.target.value)}
                                    className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#DCD5C9] rounded-lg text-[#1A1817] focus:outline-none focus:border-purple-600"
                                  >
                                    {categories.map((c) => (
                                      <option key={c.id || c.name} value={c.name}>
                                        {c.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div className="sm:col-span-2">
                                  <label className="block text-[11px] font-bold text-[#4A443E] uppercase tracking-wider mb-1">
                                    Bonus Description
                                  </label>
                                  <textarea
                                    rows={2}
                                    value={bItem.description || ''}
                                    onChange={(e) => handleUpdateBonusItem(idx, 'description', e.target.value)}
                                    placeholder="What makes this companion bonus valuable to the reader?"
                                    className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#DCD5C9] rounded-lg text-[#1A1817] focus:outline-none focus:border-purple-600"
                                  />
                                </div>
                              </div>

                              {/* Cover Image */}
                              <div>
                                <label className="block text-[11px] font-bold text-[#4A443E] uppercase tracking-wider mb-1">
                                  Cover Image
                                </label>
                                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                                  {bItem.coverImageUrl && (
                                    <img
                                      src={bItem.coverImageUrl}
                                      alt="Bonus Cover"
                                      className="w-12 h-16 object-cover rounded-md border border-[#DCD5C9] shrink-0 bg-stone-200"
                                      referrerPolicy="no-referrer"
                                    />
                                  )}
                                  <div className="flex-1 flex gap-2 w-full">
                                    <input
                                      type="text"
                                      value={bItem.coverImageUrl || ''}
                                      onChange={(e) => handleUpdateBonusItem(idx, 'coverImageUrl', e.target.value)}
                                      placeholder="https://images.unsplash.com/... or upload"
                                      className="flex-1 px-3 py-2 text-xs bg-[#FAF8F5] border border-[#DCD5C9] rounded-lg text-[#1A1817]"
                                    />
                                    <label className="px-3 py-2 text-xs font-semibold bg-[#F0EBE1] hover:bg-[#E3DBCF] text-[#1A1817] rounded-lg cursor-pointer flex items-center gap-1.5 shrink-0 border border-[#D5CEC5]">
                                      <Upload className="w-3.5 h-3.5" />
                                      {uploadingItemIndex?.type === 'bonus' && uploadingItemIndex?.index === idx && uploadingItemIndex?.target === 'cover'
                                        ? 'Uploading...'
                                        : 'Upload Cover'}
                                      <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                          if (e.target.files?.[0]) {
                                            handleItemFileUpload('bonus', idx, 'cover', e.target.files[0]);
                                          }
                                        }}
                                        className="hidden"
                                      />
                                    </label>
                                  </div>
                                </div>
                              </div>

                              {/* PDF Document Upload (Bonus) */}
                              <div className="p-3.5 bg-[#FAF8F5] border border-[#DCD5C9] rounded-xl space-y-2">
                                <div className="flex items-center justify-between">
                                  <label className="block text-[11px] font-bold text-[#4A443E] uppercase tracking-wider">
                                    Bonus PDF Document (Required) *
                                  </label>
                                  {bItem.pdfUrl && (
                                    <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                                      <Check className="w-3.5 h-3.5" /> PDF Attached
                                    </span>
                                  )}
                                </div>

                                {uploadingItemIndex?.type === 'bonus' && uploadingItemIndex?.index === idx && uploadingItemIndex?.target === 'pdf' ? (
                                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg flex items-center justify-center gap-2 text-xs text-purple-900 font-medium">
                                    <span className="inline-block w-4 h-4 border-2 border-purple-700 border-t-transparent rounded-full animate-spin"></span>
                                    Uploading PDF to Cloudinary...
                                  </div>
                                ) : bItem.pdfUrl ? (
                                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <FileText className="w-4 h-4 text-emerald-700 shrink-0" />
                                      <span className="text-xs font-semibold text-emerald-950 truncate">
                                        {bItem.pdfFileName || 'Bonus-Document.pdf'}
                                      </span>
                                      <span className="text-[10px] text-emerald-700 shrink-0 font-medium">
                                        ({bItem.fileSize || 'PDF File'})
                                      </span>
                                    </div>
                                    <label className="px-2.5 py-1 text-[11px] font-bold bg-white text-emerald-800 border border-emerald-300 rounded hover:bg-emerald-50 cursor-pointer shrink-0 transition-colors">
                                      Replace PDF
                                      <input
                                        type="file"
                                        accept="application/pdf"
                                        onChange={(e) => {
                                          if (e.target.files?.[0]) {
                                            handleItemFileUpload('bonus', idx, 'pdf', e.target.files[0]);
                                          }
                                        }}
                                        className="hidden"
                                      />
                                    </label>
                                  </div>
                                ) : (
                                  <label className="w-full p-3 bg-white hover:bg-purple-50/40 border border-dashed border-purple-300 rounded-lg cursor-pointer flex items-center justify-center gap-2 text-xs font-semibold text-purple-900 transition-colors">
                                    <Upload className="w-4 h-4 text-purple-700" />
                                    <span>Upload Bonus PDF (*.pdf)</span>
                                    <input
                                      type="file"
                                      accept="application/pdf"
                                      onChange={(e) => {
                                        if (e.target.files?.[0]) {
                                          handleItemFileUpload('bonus', idx, 'pdf', e.target.files[0]);
                                        }
                                      }}
                                      className="hidden"
                                    />
                                  </label>
                                )}
                              </div>

                              {/* Value & Page Count */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-[11px] font-bold text-[#4A443E] uppercase tracking-wider mb-1">
                                    Estimated Bonus Value (₹)
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={bItem.price || 299}
                                    onChange={(e) => handleUpdateBonusItem(idx, 'price', Number(e.target.value))}
                                    className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#DCD5C9] rounded-lg font-bold text-[#1A1817]"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-bold text-[#4A443E] uppercase tracking-wider mb-1">
                                    Page Count
                                  </label>
                                  <input
                                    type="number"
                                    min="1"
                                    value={bItem.pageCount || 50}
                                    onChange={(e) => handleUpdateBonusItem(idx, 'pageCount', Number(e.target.value))}
                                    className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#DCD5C9] rounded-lg text-[#1A1817]"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Contained "+ Add Bonus Book" Button */}
                  <div className="pt-1">
                    <button
                      type="button"
                      id="btn-add-bonus-book"
                      onClick={handleAddNewBonusItem}
                      className="w-full py-3 px-4 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-dashed border-purple-300 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                    >
                      <Plus className="w-4 h-4" /> + Add Bonus Book
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PROMOTIONAL COUPON */}
          {activeTab === 'coupon' && (
            <div className="space-y-5">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-emerald-600 text-white shrink-0">
                    <Ticket className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-emerald-950">
                      Enable Promotional Discount Coupon
                    </h3>
                    <p className="text-xs text-emerald-800">
                      Assign an exclusive discount coupon directly to this publication with server validation.
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    id="checkbox-enable-coupon"
                    type="checkbox"
                    checked={enableCoupon}
                    onChange={(e) => setEnableCoupon(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-emerald-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-emerald-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-700"></div>
                </label>
              </div>

              {enableCoupon && (
                <div className="space-y-4 p-4 bg-white border border-[#E8E2D9] rounded-xl animate-fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#4A443E] uppercase tracking-wider mb-1">
                        Coupon Code *
                      </label>
                      <input
                        id="input-ebook-coupon-code"
                        type="text"
                        placeholder="e.g. LAUNCH30, PRO25"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        className="w-full px-3 py-2 text-xs sm:text-sm font-mono font-bold uppercase bg-[#FAF8F5] border border-[#DCD5C9] rounded-lg text-[#1A1817]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#4A443E] uppercase tracking-wider mb-1">
                        Discount Percentage (1–100%) *
                      </label>
                      <div className="relative">
                        <input
                          id="input-ebook-coupon-discount"
                          type="number"
                          min="1"
                          max="100"
                          value={couponDiscountPercentage}
                          onChange={(e) => setCouponDiscountPercentage(e.target.value)}
                          className="w-full px-3 py-2 text-xs sm:text-sm bg-[#FAF8F5] border border-[#DCD5C9] rounded-lg text-[#1A1817]"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#736B63] font-semibold">%</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#4A443E] uppercase tracking-wider mb-1">
                        Expiration Date
                      </label>
                      <input
                        id="input-ebook-coupon-expiry"
                        type="date"
                        value={couponExpiresAt}
                        onChange={(e) => setCouponExpiresAt(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#DCD5C9] rounded-lg text-[#1A1817]"
                      />
                    </div>

                    <div className="flex items-center gap-3 pt-4">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                        <input
                          type="checkbox"
                          checked={couponUnlimited}
                          onChange={(e) => setCouponUnlimited(e.target.checked)}
                          className="w-4 h-4 accent-emerald-600 rounded"
                        />
                        <span>Unlimited Usage</span>
                      </label>

                      {!couponUnlimited && (
                        <input
                          type="number"
                          placeholder="Limit (e.g. 100)"
                          value={couponUsageLimit}
                          onChange={(e) => setCouponUsageLimit(e.target.value)}
                          className="w-24 px-2 py-1 text-xs bg-[#FAF8F5] border border-[#DCD5C9] rounded"
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-[#E8E2D9] shrink-0">
            <div className="text-xs text-[#736B63] flex items-center gap-2">
              {publicationType === 'COMBO' && (
                <span className="text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 text-[11px]">
                  📦 Combo ({comboItems.length} Vols)
                </span>
              )}
              {hasBonus && bonusItems.length > 0 && (
                <span className="text-purple-700 font-semibold bg-purple-50 px-2 py-0.5 rounded border border-purple-200 text-[11px]">
                  🎁 {bonusItems.length} Bonus Book{bonusItems.length > 1 ? 's' : ''}
                </span>
              )}
              {enableCoupon && (
                <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                  🎟️ {couponCode || 'Coupon'} ({couponDiscountPercentage}%)
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                id="btn-cancel-admin-ebook"
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-[#5A534B] hover:text-[#1A1817] hover:bg-[#F0EBE1] rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="btn-save-admin-ebook"
                type="submit"
                disabled={loading || uploadingCover || uploadingPdf || uploadingItemIndex !== null}
                className="px-5 py-2 text-xs font-semibold bg-[#8B2635] hover:bg-[#731E2A] text-white rounded-lg transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2 shadow-xs"
              >
                {loading ? (
                  <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <Check className="w-4 h-4" />
                )}
                {isEditMode ? 'Update Publication' : 'Publish Publication'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
