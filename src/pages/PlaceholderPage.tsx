import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

export const PlaceholderPage = ({ title, description }: { title: string, description: string }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
        <p className="text-muted-foreground">{description}</p>
      </div>

      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <p>Tính năng đang được phát triển hoặc chưa có dữ liệu.</p>
        </CardContent>
      </Card>
    </div>
  );
};
