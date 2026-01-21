import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

const BUCKET_NAME = 'product-images';
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

export function useProductImage() {
  const queryClient = useQueryClient();

  const uploadImage = async (sku: string, file: File): Promise<string> => {
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('Arquivo muito grande. Máximo 2MB.');
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('Arquivo deve ser uma imagem.');
    }

    // Create safe filename from SKU
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const safeSku = sku.replace(/[^a-zA-Z0-9-_]/g, '_');
    const fileName = `${safeSku}.${fileExt}`;

    // Delete existing image if any
    await supabase.storage.from(BUCKET_NAME).remove([fileName]);

    // Upload new image
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error('Erro ao fazer upload da imagem.');
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    const imageUrl = urlData.publicUrl;

    // Update product with image URL
    const { error: updateError } = await (supabase
      .from('products') as any)
      .update({ image_url: imageUrl })
      .eq('sku', sku);

    if (updateError) {
      console.error('Update error:', updateError);
      throw new Error('Erro ao salvar URL da imagem.');
    }

    // Invalidate products cache
    queryClient.invalidateQueries({ queryKey: ['products'] });

    return imageUrl;
  };

  const deleteImage = async (sku: string): Promise<void> => {
    // Get current image URL to find file name
    const { data: product } = await (supabase
      .from('products') as any)
      .select('image_url')
      .eq('sku', sku)
      .single();

    if (product?.image_url) {
      // Extract filename from URL
      const url = new URL(product.image_url);
      const pathParts = url.pathname.split('/');
      const fileName = pathParts[pathParts.length - 1];

      // Delete from storage
      await supabase.storage.from(BUCKET_NAME).remove([fileName]);
    }

    // Clear image_url in database
    const { error } = await (supabase
      .from('products') as any)
      .update({ image_url: null })
      .eq('sku', sku);

    if (error) {
      throw new Error('Erro ao remover imagem.');
    }

    // Invalidate products cache
    queryClient.invalidateQueries({ queryKey: ['products'] });
  };

  return { uploadImage, deleteImage };
}
