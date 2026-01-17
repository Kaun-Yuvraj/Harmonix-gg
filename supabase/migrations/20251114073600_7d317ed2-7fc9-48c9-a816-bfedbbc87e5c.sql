-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create playlists table
CREATE TABLE public.playlists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;

-- Create policies for playlists
CREATE POLICY "Users can view their own playlists" 
ON public.playlists 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own playlists" 
ON public.playlists 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own playlists" 
ON public.playlists 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own playlists" 
ON public.playlists 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create playlist_tracks table
CREATE TABLE public.playlist_tracks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  playlist_id UUID NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
  track_data JSONB NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.playlist_tracks ENABLE ROW LEVEL SECURITY;

-- Create policies for playlist_tracks
CREATE POLICY "Users can view tracks in their playlists" 
ON public.playlist_tracks 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.playlists 
  WHERE playlists.id = playlist_tracks.playlist_id 
  AND playlists.user_id = auth.uid()
));

CREATE POLICY "Users can add tracks to their playlists" 
ON public.playlist_tracks 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.playlists 
  WHERE playlists.id = playlist_tracks.playlist_id 
  AND playlists.user_id = auth.uid()
));

CREATE POLICY "Users can update tracks in their playlists" 
ON public.playlist_tracks 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.playlists 
  WHERE playlists.id = playlist_tracks.playlist_id 
  AND playlists.user_id = auth.uid()
));

CREATE POLICY "Users can delete tracks from their playlists" 
ON public.playlist_tracks 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.playlists 
  WHERE playlists.id = playlist_tracks.playlist_id 
  AND playlists.user_id = auth.uid()
));

-- Create trigger for automatic timestamp updates on playlists
CREATE TRIGGER update_playlists_updated_at
BEFORE UPDATE ON public.playlists
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_playlists_user_id ON public.playlists(user_id);
CREATE INDEX idx_playlist_tracks_playlist_id ON public.playlist_tracks(playlist_id);
CREATE INDEX idx_playlist_tracks_position ON public.playlist_tracks(playlist_id, position);